import { existsSync, promises as fs } from 'fs'
import path from 'path'
import * as R from 'ramda'
import proj4 from 'proj4'
import uuid from 'uuid-random'
import { reproject } from 'reproject'
import * as paths from '../paths'
import * as MILSTD from '../../shared/2525c'

/**
 * Read JSON file.
 * Note: Also used for testing.
 *
 * @param {String} filename name of file to read
 */
export const readJSON = async filename => JSON.parse(await fs.readFile(filename, 'utf8'))


/**
 * Legacy sources (aka tile providers).
 *
 * @param {String} location sources directory, usually $odinHome.
 */
export const readSources = async location => {
  const filename = paths.sources(location)
  if (!existsSync(filename)) return {}
  const sources = await readJSON(filename)

  return sources.reduce((acc, source) => {
    const id = source.id
    delete source.id
    acc[`basemap:${id}`] = source
    return acc
  }, {})
}


/**
 * Plain project UUIDs (not projects paths) for all projects in $location/projects.
 *
 * @param {String} location projects parent directory
 */
export const readProjects = async location => {

  // [direntry] -> [project-UUID]
  const uuids = (() => {
    const UUID_PATTERN = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89AB][a-f\d]{3}-[a-f\d]{12}$/i
    const isDirectory = dirent => dirent.isDirectory()
    const name = dirent => dirent.name
    const isUUID = name => UUID_PATTERN.test(name)
    return R.compose(R.filter(isUUID), R.map(name), R.filter(isDirectory))
  })()

  const path = paths.projects(location)
  const files = await fs.readdir(path, { withFileTypes: true })
  return uuids(files)
}


/**
 * Layer names for a given project.
 *
 * @param {String} location projects parent directory
 * @param {String} uuid project UUID
 */
export const readLayers = async (location, uuid) => {
  const dir = paths.layers(location, uuid)
  const files = await fs.readdir(dir, { withFileTypes: true })

  const names = (() => {
    const layerName = name => path.basename(name, '.json')
    const name = dirent => dirent.name
    const hasExtension = ext => dirent => dirent.name.endsWith(ext)
    const isFile = dirent => dirent.isFile()

    return R.compose(
      R.map(layerName),
      R.map(name),
      R.filter(hasExtension('.json')),
      R.filter(isFile)
    )
  })()

  return names(files)
}


/**
 * Metadata for a given project UUID.
 *
 * metadata: {
 *   name: String - project name,
 *   lastAccess: String - datetime
 * }
 *
 * @param {String} location projects parent directory
 * @param {String} uuid project UUID
 */
export const readMetadata = (location, uuid) => {
  const filename = paths.metadata(location, uuid)
  return readJSON(filename)
}


/**
 * Preferences for a given project UUID.
 *
 * preferences: {
 *   activeLayer: String - name of active/default layer,
 *   viewport - Map center (Web Mercator) and zoom,
 *   basemaps: [basemap] - tile providers references used in project
 * }
 *
 * viewport: {
 *   zoom: Number,
 *   center: [Number, Number] - Web Mercator
 * }
 *
 * basemap: {
 *   id: UUID,
 *   name: String,
 *   basemap: Boolean
 *   opacity: Number [0, 1]
 * }
 *
 * @param {*} location projects parent directory
 * @param {*} uuid project UUID
 */
export const readPreferences = async (location, uuid) => {
  const filename = paths.preferences(location, uuid)
  const json = await readJSON(filename)
  delete json.paletteMemento // no longer needed

  // Convert WGS84 (EPSG:4326) center to Web Mercator (EPSG:3857).
  if (json.viewport && json.viewport.center) {
    json.viewport.center = proj4('EPSG:4326', 'EPSG:3857', json.viewport.center)
  }

  return json
}


/**
 * Layer info and features.
 *
 * layer: {
 *   id: layer id,
 *   name: layer name,
 *   features: [feature id -> feature]
 * }
 *
 * @param {String} location projects parent directory
 * @param {String} projectUUID project UUID
 * @param {String} layer layer name (without '.json' extension)
 */
export const readLayer = async (location, projectUUID, layer) => {
  const filename = paths.layer(location, projectUUID, layer)
  const json = await readJSON(filename)

  // Rewrite layers/features as associative arrays with ids as keys.
  // NOTE: We have to make sure that feature layerIds property is
  // same for each feature in a layer.

  const layerIds = R.uniq(json.features.map(feature => {
    const layerId = feature.properties.layerId
    delete feature.properties.layerId
    return layerId
  }))

  const layerId = layerIds.length === 1
    ? R.head(layerIds)
    : `layer:${uuid()}` // no features or layer id is ambiguous

  const features = json.features.map(feature => {
    // Reproject geometry to Web Mercator:
    feature.geometry = reproject(feature.geometry, 'EPSG:4326', 'EPSG:3857')

    if (feature.properties.locked) { feature.locked = true; delete feature.properties.locked }
    if (feature.properties.hidden) { feature.hidden = true; delete feature.properties.hidden }

    const sidc = feature.properties.sidc
    feature.identity = MILSTD.identityText(sidc)

    const descriptor = MILSTD.descriptor(sidc)
    if (descriptor) {
      feature.hierarchy = descriptor.hierarchy
      feature.scope = descriptor.scope
      feature.dimensions = descriptor.dimensions
    }

    return feature
  })

  return { id: layerId, name: layer, features }
}
