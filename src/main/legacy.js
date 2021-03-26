import path from 'path'
import { existsSync, promises as fs } from 'fs'
import * as R from 'ramda'
import uuid from 'uuid-random'
import sublevel from 'subleveldown'
import * as L from '../shared/level'
import { wkb } from '../shared/encoding'

const UUID_PATTERN = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89AB][a-f\d]{3}-[a-f\d]{12}$/i

const projectsDirectory = directory => path.join(directory, 'projects')
const isDirectory = dirent => dirent.isDirectory()
const isFile = dirent => dirent.isFile()
const hasExtension = ext => dirent => dirent.name.endsWith(ext)
const name = dirent => dirent.name
const isUUID = name => UUID_PATTERN.test(name)
const layerName = name => path.basename(name, '.json')
const readJSON = async filename => JSON.parse(await fs.readFile(filename, 'utf8'))

const projectUUIDs = directory => async () => {
  const files = await fs.readdir(projectsDirectory(directory), { withFileTypes: true })
  const pipe = R.compose(R.filter(isUUID), R.map(name), R.filter(isDirectory))
  return pipe(files)
}

const metadata = directory => project => {
  const filename = path.join(projectsDirectory(directory), project, 'metadata.json')
  return readJSON(filename)
}

const preferences = directory => project => {
  const filename = path.join(projectsDirectory(directory), project, 'preferences.json')
  return readJSON(filename)
}

const sources = directory => () => {
  const filename = path.join(directory, 'sources.json')
  return existsSync(filename)
    ? readJSON(filename)
    : []
}

const layers = directory => async project => {
  const dir = path.join(projectsDirectory(directory), project, 'layers')
  const files = await fs.readdir(dir, { withFileTypes: true })
  const pipe = R.compose(R.map(layerName), R.map(name), R.filter(hasExtension), R.filter(isFile))
  return pipe(files)
}

const geoJSON = directory => async (project, layer) => {
  const removeIdentifiers = R.tap(feature => {
    delete feature.id
    delete feature.properties.layerId
  })

  const filename = path.join(projectsDirectory(directory), project, 'layers', `${layer}.json`)
  const json = await readJSON(filename)
  const features = R.map(removeIdentifiers)(json.features)
  return { type: 'FeatureCollection', features }
}

const readProjects = async directory => {

  const home = {
    projectUUIDs: projectUUIDs(directory),
    metadata: metadata(directory),
    preferences: preferences(directory),
    layers: layers(directory),
    geoJSON: geoJSON(directory)
  }

  return R.reduce(async (acc, id) => {
    // Read layers and assign layer/feature ids used later on.
    const layers = R.reduce(async (acc, layer) => {
      const layerUUID = uuid()
      const layerId = `layer:${layerUUID}`
      const geoJSON = await home.geoJSON(id, layer)
      const createIdProperty = R.tap(feature => (feature.featureId = `feature:${layerUUID}/${uuid()}`))
      geoJSON.features = R.map(createIdProperty)(geoJSON.features)
      return (await acc).concat({ layerId, name: layer, geoJSON })
    }, [])(await home.layers(id))

    return (await acc).concat({
      id,
      layers: await layers,
      metadata: await metadata(directory)(id),
      preferences: await preferences(directory)(id)
    })
  }, [])(await home.projectUUIDs())
}

const write = (key, value) => R.tap(batch => batch.put(key, value))

const writeProject = (batch, { id, metadata }) => write(`project:${id}`, metadata)(batch)
const writeBasemap = (batch, { id, ...value }) => write(`basemap:${id}`, value)(batch)
const writeGeometry = (batch, { featureId, geometry }) => write(featureId, geometry)(batch)
const writeGeometries = (batch, { geoJSON }) => R.reduce(writeGeometry, batch)(geoJSON.features)
const writeFeature = (batch, { featureId, properties }) => write(featureId, { properties })(batch)
const writeFeatures = R.reduce(writeFeature)

const writeLayer = (batch, { layerId, name, geoJSON }) => {
  batch.put(layerId, { name })
  return writeFeatures(batch, geoJSON.features)
}

const createProjectDatabase = projectDatabase => async project => {
  const { preferences, layers } = project
  const db = projectDatabase(project.id)
  const geometries = sublevel(db, 'geometries', wkb)
  const tuples = sublevel(db, 'tuples', { valueEncoding: 'json' })
  await R.reduce(writeLayer)(tuples.batch(), layers).write()
  await R.reduce(writeGeometries)(geometries.batch(), layers).write()
  await tuples.put('property:viewport', preferences.viewport)
  // TODO: property:default-layer
  // await db.close()
}

export const transfer = async options => {
  const { directory, master, projectDatabase } = options

  const transferred = await L.get(master, 'legacy:transferred', false)
  if (transferred) return false

  const projects = await readProjects(directory)
  const basemaps = await sources(directory)()

  const batch = master.batch()
  R.reduce(writeBasemap)(batch, basemaps)
  R.reduce(writeProject)(batch, projects)
  await batch.write()

  await Promise.all(projects.map(createProjectDatabase(projectDatabase)))

  await master.put('legacy:transferred', true)
  return true
}
