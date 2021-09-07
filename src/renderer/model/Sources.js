import util from 'util'
import VectorSource from 'ol/source/Vector'
import Emitter from '../../shared/emitter'
import { readFeature, readFeatures, readGeometry } from '../store/format'


/**
 * @constructor
 */
export function Sources (layerStore, selection) {
  Emitter.call(this)
  this.layerStore_ = layerStore
  this.selection_ = selection

  // For now, hold all features in a single source.
  // This might change in the future, especially for 'external' features/sources.
  // Note: Source is mutable. Changes reflect more or less immediately in map.
  this.source_ = null

  layerStore.on('features/batch', ({ operations }) => this.updateFeatures_(operations))
  layerStore.on('features/properties', ({ operations }) => this.updateProperties_(operations))
  layerStore.on('features/geometries', ({ operations }) => this.updateGeometries_(operations))
}

util.inherits(Sources, Emitter)


/**
 * @private
 */
Sources.prototype.updateFeatures_ = function (operations) {
  if (!operations.length) return

  if (!this.source_) this.source_ = new VectorSource({ features: [] })

  const removeFeatureById = id => {
    const feature = this.source_.getFeatureById(id)
    if (!feature) return
    this.source_.removeFeature(feature)
  }

  const addFeature = value => {
    // TODO: ignore hidden features
    const feature = readFeature(value)
    this.source_.addFeature(feature)
  }

  const removals = operations.filter(op => op.type === 'del').map(op => op.key)
  const additions = operations.filter(op => op.type === 'put').map(op => op.value)

  removals.forEach(id => removeFeatureById(id))
  additions.forEach(value => removeFeatureById(value.id))
  additions.forEach(addFeature)
  this.selection_.deselect(removals)
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
  const updates = operations
    .filter(({ key }) => this.source_.getFeatureById(key))

  updates.forEach(({ key, value }) => {
    const feature = this.source_.getFeatureById(key)
    // Note: Does not increase revision counter
    feature.setProperties(value.properties, true)
    feature.changed()
  })
}


/**
 * @returns ol/VectorSource
 * NOTE: Source is loaded laziliy.
 */
Sources.prototype.getFeatureSource = async function () {
  if (this.source_) return this.source_
  const geoJSONFeatures = await this.layerStore_.getFeatures()
  const olFeatures = readFeatures({ type: 'FeatureCollection', features: geoJSONFeatures })
  this.source_ = new VectorSource({ features: olFeatures })
  return this.source_
}
