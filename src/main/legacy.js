import path from 'path'
import { existsSync, promises as fs } from 'fs'
import * as R from 'ramda'
import uuid from 'uuid-random'

const UUID_PATTERN = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89AB][a-f\d]{3}-[a-f\d]{12}$/i

const projectsDirectory = directory => path.join(directory, 'projects')
const isDirectory = dirent => dirent.isDirectory()
const isFile = dirent => dirent.isFile()
const hasExtension = ext => dirent => dirent.name.endsWith(ext)
const name = dirent => dirent.name
const isUUID = name => UUID_PATTERN.test(name)
const layerName = name => path.basename(name, '.json')
const readJSON = async filename => JSON.parse(await fs.readFile(filename, 'utf8'))


export const home = directory => {
  const home = {}

  home.projectUUIDs = async () => {
    const files = await fs.readdir(projectsDirectory(directory), { withFileTypes: true })
    const pipeline = R.compose(R.filter(isUUID), R.map(name), R.filter(isDirectory))
    return pipeline(files)
  }


  /**
   * project metadata: main process
   *
   * metadata: {
   *   name: String - project name,
   *   lastAccess: String - datetime
   * }
   */
  home.metadata = project => {
    const filename = path.join(projectsDirectory(directory), project, 'metadata.json')
    return readJSON(filename)
  }


  /**
   * project preferences: renderer process
   *
   * preferences: {
   *   activeLayer: String - name of active/default layer,
   *   viewport - Map center and zoom,
   *   basemaps: [basemap] - tile providers references used in project
   * }
   *
   * viewport: {
   *   zoom: Number,
   *   center: [Number, Number] - WGS84
   * }
   *
   * basemap: {
   *   id: UUID,
   *   name: String,
   *   basemap: Boolean
   *   opacity: Number [0, 1]
   * }
   */
  home.preferences = async project => {
    const filename = path.join(projectsDirectory(directory), project, 'preferences.json')
    const json = await readJSON(filename)
    delete json.paletteMemento // no longer needed
    return json
  }

  home.sources = async () => {
    const filename = path.join(directory, 'sources.json')
    if (!existsSync(filename)) return {}
    const json = await readJSON(filename)

    return json.reduce((acc, basemap) => {
      const id = basemap.id
      delete basemap.id
      acc[`basemap:${id}`] = basemap
      return acc
    }, {})
  }

  home.layers = async project => {
    const dir = path.join(projectsDirectory(directory), project, 'layers')
    const files = await fs.readdir(dir, { withFileTypes: true })
    const pipeline = R.compose(
      R.map(layerName),
      R.map(name),
      R.filter(hasExtension),
      R.filter(isFile)
    )

    return pipeline(files)
  }

  home.layer = async (project, layer) => {
    const filename = path.join(projectsDirectory(directory), project, 'layers', `${layer}.json`)
    const json = await readJSON(filename)

    // Rewrite layers/features as associative arrays with ids as keys.
    // NOTE: We have to make sure that feature layerIds property is
    // same for each feature in a layer.

    const layerIds = R.uniq(json.features.map(feature => {
      const layerId = feature.properties.layerId
      delete feature.properties.layerId
      return layerId
    }))

    if (layerIds.length > 1) {
      throw new Error(`invalid layer; layer id is ambiguous [${project}, ${layer}]`)
    }

    const layerId = layerIds.length === 1
      ? R.head(layerIds)
      : `layer:${uuid()}` // no features; layer id cannot be inferred.

    const features = json.features.reduce((acc, feature) => {
      const featureId = feature.id
      delete feature.id
      acc[featureId] = feature
      return acc
    }, {})

    return { id: layerId, name: layer, features }
  }

  return home
}



export const projects = async home => {
  return R.reduce(async (acc, projectId) => {

    const layers = R.reduce(async (acc, layer) => {
      const { id: layerId, features } = await home.layer(projectId, layer)
      const layers = await acc
      layers[layerId] = { name: layer, features }
      return layers
    }, {})(await home.layers(projectId))

    const projects = await acc
    projects[`project:${projectId}`] = {
      layers: await layers,
      metadata: await home.metadata(projectId),
      preferences: await home.preferences(projectId)
    }

    return acc
  }, {})(await home.projectUUIDs())
}
