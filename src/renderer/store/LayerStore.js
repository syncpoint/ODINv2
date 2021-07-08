import util from 'util'
import Emitter from '../../shared/emitter'
import { tuplePartition, geometryPartition } from '../../shared/stores'

export function LayerStore (db) {
  Emitter.call(this)
  this.tuples = tuplePartition(db)
  this.geometries = geometryPartition(db)
  console.log(this.tuples, this.geometries)
}

LayerStore.prototype.featureProperties = function (layerId) {
  return new Promise((resolve, reject) => {
    const acc = {}

    const prefix = layerId
      ? `feature:${layerId.split(':')[1]}`
      : 'feature:'

    const options = prefix
      ? { keys: true, values: true, gte: prefix, lte: prefix + '\xff' }
      : { keys: true, values: true }

    this.tuples.createReadStream(options)
      .on('data', ({ key, value }) => (acc[key] = value))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}

LayerStore.prototype.featureGeometries = function (layerId) {
  return new Promise((resolve, reject) => {
    const acc = {}

    const prefix = layerId
      ? `feature:${layerId.split(':')[1]}`
      : 'feature'

    const options = prefix
      ? { keys: true, values: true, gte: prefix, lte: prefix + '\xff' }
      : { keys: true, values: true }

    this.geometries.createReadStream(options)
      .on('data', ({ key, value }) => (acc[key] = value))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}

LayerStore.prototype.getFeatures = async function (layerId) {
  const properties = await this.featureProperties(layerId)
  const geometries = await this.featureGeometries(layerId)

  const features = Object.entries(properties).reduce((acc, [key, properties]) => {
    const feature = { type: 'Feature', id: key, ...properties, geometry: geometries[key] }
    acc[key] = feature
    return acc
  }, {})

  const layers = Object.entries(features).reduce((acc, [key, feature]) => {
    const layerUUID = key.split(':')[1].split('/')[0]
    const layerId = `layer:${layerUUID}`
    acc[layerId] = acc[layerId] || { type: 'FeatureCollection', features: [] }
    acc[layerId].features.push(feature)
    return acc
  }, {})

  return layers
}

util.inherits(LayerStore, Emitter)
