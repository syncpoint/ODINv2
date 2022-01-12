import util from 'util'
import VectorSource from 'ol/source/Vector'
import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import Emitter from '../../shared/emitter'
import { readFeature, readFeatures } from '../store/format'

const isVisible = feature => !feature.hidden
const isHidden = feature => feature.hidden

/**
 * @constructor
 */
export function Sources (store, selection, highlight) {
  Emitter.call(this)
  this.store_ = store
  this.selection_ = selection

  // For now, hold all features in a single source.
  // This might change in the future, especially for 'external' features/sources.
  // Note: Source is mutable. Changes reflect more or less immediately in map.
  this.source_ = null

  this.highlightedFeatures_ = new Collection()
  this.highlightedSource_ = new VectorSource({ features: this.highlightedFeatures_ })

  store.on('batch', ({ operations }) => this.update_(operations))
  highlight.on('highlight/geometries', ({ geometries }) => this.highlightGeometries_(geometries))
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


Sources.prototype.update_ = function (operations) {

  // Removal deleted features:
  operations
    .filter(({ type }) => type === 'del')
    .map(op => op.key)
    .forEach(key => this.removeFeatureById_(key))

  // Remove hidden features:
  operations
    .filter(({ type, value }) => type === 'put' && isHidden(value))
    .forEach(({ key }) => this.removeFeatureById_(key))

  // Add new or replace existing features:
  operations
    .filter(({ type, value }) => type === 'put' && isVisible(value))
    .forEach(({ key, value }) => {
      if (this.source_.getFeatureById(key)) this.removeFeatureById_(key)
      this.addFeature_(value)
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

Sources.prototype.getHighlightedSource = function () {
  return this.highlightedSource_
}

Sources.prototype.highlightGeometries_ = function (geometries) {
  if (!geometries.length) this.highlightedFeatures_.clear()
  else geometries.forEach(geometry => this.highlightedFeatures_.push(new Feature(geometry)))
}
