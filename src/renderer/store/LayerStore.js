import util from 'util'
import uuid from 'uuid-random'
import Emitter from '../../shared/emitter'
import { tuplePartition, geometryPartition } from '../../shared/stores'


/**
 * @constructor
 * @param {*} db project database.
 */
export function LayerStore (db) {
  Emitter.call(this)
  this.propertiesStore = tuplePartition(db)
  this.geometryStore = geometryPartition(db)

  this.commands = {
    importGeoJSON: json => {
      const layerUUID = uuid()
      const layerId = `layer:${layerUUID}`

      return {
        apply: () => {
          const features = json.features.map(feature => {
            delete feature.id // just to make sure
            delete feature.title // mipdb legacy field
            delete feature.type // no need to keep
            return [`feature:${layerUUID}/${uuid()}`, feature]
          }, {})

          this.putFeatures(layerId, features)
        },
        inverse: () => {
          // TODO: b9e5feb5-6e83-476d-a770-453ec0d937fd - layer store/command: importGeoJSON/inverse
          console.log('[importGeoJSON] inverse')
        }
      }
    }
  }
}

util.inherits(LayerStore, Emitter)

/**
 * @private
 * @param {String} layerId optional
 * @returns Feature properties for given layer or all features.
 */
LayerStore.prototype.properties = function (layerId) {
  return new Promise((resolve, reject) => {
    const acc = {}

    const prefix = layerId
      ? `feature:${layerId.split(':')[1]}`
      : 'feature:'

    const options = prefix
      ? { keys: true, values: true, gte: prefix, lte: prefix + '\xff' }
      : { keys: true, values: true }

    this.propertiesStore.createReadStream(options)
      .on('data', ({ key, value }) => (acc[key] = value))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * @private
 * @param {String} layerId optional
 * @returns Feature geometries for given layer or all features.
 */
LayerStore.prototype.geometries = function (layerId) {
  return new Promise((resolve, reject) => {
    const acc = {}

    const prefix = layerId
      ? `feature:${layerId.split(':')[1]}`
      : 'feature'

    const options = prefix
      ? { keys: true, values: true, gte: prefix, lte: prefix + '\xff' }
      : { keys: true, values: true }

    this.geometryStore.createReadStream(options)
      .on('data', ({ key, value }) => (acc[key] = value))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * @param {String} layerId optional
 * @returns GeoJSON FeatureCollection, i.e. Features for given layer or all features.
 */
LayerStore.prototype.getFeatures = async function (layerId) {
  const properties = await this.properties(layerId)
  const geometries = await this.geometries(layerId)
  const features = Object.entries(properties).map(([id, properties]) => ({
    type: 'Feature',
    id,
    properties,
    geometry: geometries[id]
  }))

  return { type: 'FeatureCollection', features }
}

LayerStore.prototype.putFeatures = async function (layerId, features) {
  const propertiesOp = ([key, feature]) => ({ type: 'put', key, value: feature.properties })
  const geometryOp = ([key, feature]) => ({ type: 'put', key, value: feature.geometry })
  await this.propertiesStore.batch(features.map(propertiesOp))
  await this.geometryStore.batch(features.map(geometryOp))

  // TODO: 39af245a-bb33-480d-b2ba-f7be1e5ba446 - layer store/import: write layer properties

  const op = ([key, feature]) => ({ type: 'put', key, value: { type: 'Feature', ...feature, id: key } })
  this.emit('batch', { operations: features.map(op) })
}
