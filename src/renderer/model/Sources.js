import util from 'util'
import VectorSource from 'ol/source/Vector'
import Emitter from '../../shared/emitter'
import { readFeature, readFeatures, readGeometry } from '../store/format'

const isVisible = feature => !feature.hidden
const isHidden = feature => feature.hidden

/**
 * @constructor
 */
export function Sources (store, selection) {
  Emitter.call(this)
  this.store_ = store
  this.selection_ = selection

  // For now, hold all features in a single source.
  // This might change in the future, especially for 'external' features/sources.
  // Note: Source is mutable. Changes reflect more or less immediately in map.
  this.source_ = null

  store.on('features/properties', ({ operations }) => this.updateProperties_(operations))
  store.on('features/geometries', ({ operations }) => this.updateGeometries_(operations))
}

util.inherits(Sources, Emitter)


/**
 *
 */
Sources.prototype.removeFeatureById_ = function (id) {
  const feature = this.source_.getFeatureById(id)
  if (!feature) return
  this.source_.removeFeature(feature)
}


/**
 *
 */
Sources.prototype.addFeature_ = function (feature) {
  if (!feature) return
  if (isHidden(feature)) return
  this.source_.addFeature(readFeature(feature))
}


/**
 * @private
 */
Sources.prototype.updateGeometries_ = function (operations) {
  operations
    .filter(({ key }) => this.source_.getFeatureById(key))
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
  const removals = operations
    .filter(({ type }) => type === 'del')
    .map(op => op.key)
  removals.forEach(id => this.removeFeatureById_(id))
  this.selection_.deselect(removals)

  // Remove hidden features:
  operations
    .filter(({ type, value }) => type === 'put' && isHidden(value))
    .forEach(({ key }) => this.removeFeatureById_(key))

  operations
    .filter(({ type, value }) => type === 'put' && isVisible(value))
    .forEach(({ key, value }) => {
      const feature = this.source_.getFeatureById(key)
      if (!feature) {
        // Note: Does not have a geometry yet.
        this.addFeature_(value)
      } else {
        // Note: Does not increase revision counter
        feature.setProperties(value.properties, true)
        feature.changed()
      }
    })
}


/**
 * @returns ol/VectorSource
 * NOTE: Source is loaded laziliy.
 */
Sources.prototype.getFeatureSource = async function () {
  if (this.source_) return this.source_
  const geoJSONFeatures = await this.store_.selectFeatures()
  const visible = geoJSONFeatures.filter(isVisible)
  const olFeatures = readFeatures({ type: 'FeatureCollection', features: visible })
  this.source_ = new VectorSource({ features: olFeatures })
  return this.source_
}
