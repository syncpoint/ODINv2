import * as R from 'ramda'
import util from 'util'
import { promises as fs } from 'fs'
import path from 'path'
import { reproject } from 'reproject'
import Emitter from '../shared/emitter'
import * as ID from './ids'

const readJSON = async path => {
  const content = await fs.readFile(path, 'utf8')
  return JSON.parse(content)
}

/**
 * @constructor
 * @fires ...
 */
export function DragAndDrop (featureStore) {
  Emitter.call(this)
  this.featureStore = featureStore
}

util.inherits(DragAndDrop, Emitter)

DragAndDrop.prototype.dragenter = function (event) {}
DragAndDrop.prototype.dragleave = function (event) {}

DragAndDrop.prototype.dragover = function (event) {
  event.preventDefault()
  event.stopPropagation()
}

DragAndDrop.prototype.drop = async function (event) {
  event.preventDefault()
  event.stopPropagation()

  const files = [...event.dataTransfer.files]
  const extensions = R.groupBy(file => path.extname(file.name), files)
  Object.entries(extensions).forEach(([extension, files]) => {
    const key = extension.substring(1)
    if (this[key]) this[key](files)
  })
}

DragAndDrop.prototype.json = async function (files) {
  // We expect JSON to be valid GeoJSON (FeatureCollection) only.

  const geoJSON = await Promise.all(files.map(file => readJSON(file.path)))
  const featureCollections = geoJSON.filter(json => json.type === 'FeatureCollection')

  const tuples = featureCollections.flatMap((collection, index) => {
    const tuples = []

    // Layer.
    const basename = path.basename(files[index].name, '.json')
    const layerId = ID.layerId()
    const value = { name: collection.name || basename }
    tuples.push([layerId, value])

    // Features.
    const features = collection.features.map(feature => {
      const featureId = ID.featureId(layerId)
      const { type, geometry } = feature
      // drop properties: layerId, locked, hidden
      const { layerId: _, title, name, locked, hidden, ...properties } = feature.properties
      const value = {
        type,
        properties,
        geometry: reproject(geometry, 'EPSG:4326', 'EPSG:3857')
      }

      if (name || title) value.name = name || title
      return [featureId, value]
    })

    return tuples.concat(features)
  })

  this.featureStore.insert(tuples)
}
