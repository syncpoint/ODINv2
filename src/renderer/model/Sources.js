import util from 'util'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Emitter from '../../shared/emitter'
import { isFeature } from '../ids'
import { readFeature, readFeatures, readGeometry } from '../store/format'


/**
 * removeFeature :: ol/Feature | string -> unit
 */
const removeFeature = source => x => {
  if (x instanceof Feature) source.removeFeature(x)
  else if (x.type === 'Feature') source.removeFeature(source.getFeatureById(x.id))
  else if (typeof x === 'string') source.removeFeature(source.getFeatureById(x))
}

const addFeature = source => x => {
  if (!x || x.hidden || !isFeature(x.id)) return
  source.addFeature(readFeature(x))
}

export function Sources (layerStore) {
  Emitter.call(this)
  this.layerStore = layerStore

  // For now, hold all features in a single source.
  // This might change in the future, especially for 'external' features/sources.
  // Note: Source is mutable. Changes reflect more or less immediately in map.
  this.featureSource = null

  layerStore.on('batch', ({ operations }) => this.storeBatch_(operations))
  layerStore.on('geometries', ({ operations }) => this.updateGeometries(operations))
}

util.inherits(Sources, Emitter)

Sources.prototype.storeBatch_ = function (operations) {
  if (!this.featureSource) this.featureSource = new VectorSource({ features: [] })

  const removals = operations.filter(op => op.type === 'del').map(op => op.key)
  const additions = operations.filter(op => op.type === 'put').map(op => op.value)

  removals.forEach(removeFeature(this.featureSource))
  additions.forEach(removeFeature(this.featureSource))
  additions.forEach(addFeature(this.featureSource)) // TODO: bulk - addFeatures()
}

Sources.prototype.getFeatureSource = async function () {
  if (this.featureSource) return this.featureSource
  const json = await this.layerStore.getFeatures()
  const features = readFeatures(json)
  this.featureSource = new VectorSource({ features })
  return this.featureSource
}

Sources.prototype.updateGeometries = function (operations) {
  operations
    .map(({ key, value }) => ({ key, geometry: readGeometry(value) }))
    .forEach(({ key, geometry }) => {
      const feature = this.featureSource.getFeatureById(key)
      feature.setGeometry(geometry)
    })
}
