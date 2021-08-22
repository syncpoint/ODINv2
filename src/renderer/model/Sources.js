import util from 'util'
import * as R from 'ramda'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Emitter from '../../shared/emitter'
import { isFeatureId } from '../ids'
import { readFeature, readFeatures, readGeometry } from '../store/format'


/**
 * @constructor
 */
export function Sources (layerStore) {
  Emitter.call(this)
  this.layerStore = layerStore

  // For now, hold all features in a single source.
  // This might change in the future, especially for 'external' features/sources.
  // Note: Source is mutable. Changes reflect more or less immediately in map.
  this.source_ = null

  layerStore.on('batch', ({ operations }) => this.storeBatch_(operations))
  layerStore.on('geometries', ({ operations }) => this.updateGeometries_(operations))
  layerStore.on('properties', ({ operations }) => this.updateProperties_(operations))
}

util.inherits(Sources, Emitter)


/**
 * removeFeature :: ol/Feature | GeoJSON/Feature | string -> unit
 * NOTE: Must not be called for features not contained in source.
 * @private
 */
Sources.prototype.removeFeature_ = function (featureLike) {
  if (featureLike instanceof Feature) this.source_.removeFeature(featureLike)
  else if (featureLike.type === 'Feature') this.removeFeature_(featureLike.id)
  else if (typeof x === 'string') this.removeFeature_(this.source_.getFeatureById(featureLike))
}


/**
 * @private
 */
Sources.prototype.addFeature_ = function (feature) {
  if (!feature || feature.hidden || !isFeatureId(feature.id)) return
  this.source_.addFeature(readFeature(feature))
}


/**
 * @private
 */
Sources.prototype.storeBatch_ = function (operations) {
  if (!this.source_) this.source_ = new VectorSource({ features: [] })

  const removals = operations.filter(op => op.type === 'del').map(op => op.key)
  const additions = operations.filter(op => op.type === 'put').map(op => op.value)

  const removeFeature = this.removeFeature_.bind(this)
  const addFeature = this.addFeature_.bind(this)

  removals.forEach(removeFeature)
  additions
    .map(feature => this.source_.getFeatureById(feature.id))
    .filter(R.identity) // may already exist or not
    .forEach(removeFeature)

  additions.forEach(addFeature)
}


/**
 * @private
 */
Sources.prototype.updateGeometries_ = function (operations) {
  operations
    .map(({ key, value }) => ({ key, geometry: readGeometry(value) }))
    .forEach(({ key, geometry }) => {
      const feature = this.source_.getFeatureById(key)
      feature.setGeometry(geometry)
    })
}


/**
 * @private
 */
Sources.prototype.updateProperties_ = function (operations) {
  operations
    .forEach(({ key, value }) => {
      const feature = this.source_.getFeatureById(key)
      // Note: Does not increase revision counter
      feature.setProperties(value.properties, true)
      feature.changed()
    })
}


/**
 * @returns ol/VectorSource
 * NOTE: Source is laziliy loaded.
 */
Sources.prototype.getFeatureSource = async function () {
  if (this.source_) return this.source_
  const json = await this.layerStore.getFeatures()
  const features = readFeatures(json)
  this.source_ = new VectorSource({ features })
  return this.source_
}
