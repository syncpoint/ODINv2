import util from 'util'
import Emitter from '../../shared/emitter'
import { tuplePartition, geometryPartition } from '../../shared/stores'

export function LayerStore (db) {
  Emitter.call(this)
  this.propertiesStore = tuplePartition(db)
  this.geometryStore = geometryPartition(db)
}

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

LayerStore.prototype.getFeatures = async function (layerId) {
  const properties = await this.properties(layerId)
  const geometries = await this.geometries(layerId)
  const features = Object.entries(properties).map(([id, properties]) => ({
    type: 'Feature',
    id,
    ...properties,
    geometry: geometries[id]
  }))

  return { type: 'FeatureCollection', features }
}

util.inherits(LayerStore, Emitter)
