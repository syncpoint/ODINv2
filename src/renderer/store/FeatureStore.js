import * as R from 'ramda'
import util from 'util'
import GeoJSON from 'ol/format/GeoJSON'
import * as Extent from 'ol/extent'
import Emitter from '../../shared/emitter'
import { debounce, batch } from '../../shared/debounce'
import * as ID from '../ids'

const format = new GeoJSON({
  dataProjection: 'EPSG:3857',
  featureProjection: 'EPSG:3857'
})


export const readFeature = source => format.readFeature(source)
export const readFeatures = source => format.readFeatures(source)
export const readGeometry = source => format.readGeometry(source)
export const writeGeometry = geometry => format.writeGeometry(geometry)
export const writeGeometryObject = geometry => format.writeGeometryObject(geometry)

// writeFeatureCollection :: [ol/Feature] -> GeoJSON/FeatureCollection
export const writeFeatureCollection = features => format.writeFeaturesObject(features)
export const writeFeatureObject = feature => format.writeFeatureObject(feature)


/**
 *
 */
const FeatureHolder = function (feature) {
  this.feature = feature
  this.id = feature.getId()
}

FeatureHolder.prototype.dispose = function () {
  delete this.feature
  delete this.id
}

const featureHolder = feature => new FeatureHolder(feature)

export function FeatureStore (store) {
  this.store = store
  this.features = {}

  // TODO: rather debounce in sources?
  const debouncedHandler = batch(debounce(32), this.batch.bind(this))
  store.on('batch', ({ operations }) => debouncedHandler(operations))

  // On startup: load all features:
  window.requestIdleCallback(async () => {
    await this.loadFeatures('feature:')
    await this.loadFeatures('marker:')
  }, { timeout: 2000 })
}

util.inherits(FeatureStore, Emitter)


/**
 *
 */
FeatureStore.prototype.loadFeatures = async function (scope) {
  const tuples = await this.store.tuples(scope)
  const geoJSON = tuples.map(([id, feature]) => ({ id, ...feature }))
  const [valid, invalid] = R.partition(R.prop('type'), geoJSON)
  if (invalid.length) console.warn('invalid features', invalid)
  this.addFeatures(readFeatures({ type: 'FeatureCollection', features: valid }))
}


/**
 *
 */
FeatureStore.prototype.batch = function (operations) {
  const isCandidateId = id => ID.isFeatureId(id) || ID.isMarkerId(id)
  const candidates = operations.filter(({ key }) => isCandidateId(key))

  const [removals, other] = R.partition(({ type }) => type === 'del', candidates)
  const [updates, additions] = R.partition(({ key }) => this.features[key], other)
  this.handleRemovals(removals)
  this.handleAdditions(additions)
  this.handleUpdates(updates)
}


/**
 *
 */
FeatureStore.prototype.handleAdditions = function (additions) {
  if (additions.length === 0) return
  const features = additions.map(({ key, value }) => readFeature({ id: key, ...value }))
  this.addFeatures(features)
}


/**
 *
 */
FeatureStore.prototype.handleRemovals = function (removals) {
  if (removals.length === 0) return
  const features = removals.map(({ key }) => this.features[key].feature)
  removals.forEach(({ key }) => {
    this.features[key].dispose()
    delete this.features[key]
  })

  this.emit('removefeatures', ({ features }))
}


/**
 * FIXME: redundant code
 */
const isGeometry = value => {
  if (!value) return false
  else if (typeof value !== 'object') return false
  else {
    if (!value.type) return false
    else if (!value.coordinates && !value.geometries) return false
    return true
  }
}

/**
 *
 */
FeatureStore.prototype.handleUpdates = function (updates) {
  updates.forEach(({ key, value }) => {
    const properties = isGeometry(value)
      ? { geometry: readGeometry(value) }
      : readFeature(value).getProperties()

    // Merge old and new values.
    const feature = this.features[key].feature
    feature.setProperties({ ...feature.getProperties(), ...properties })
  })
}

/**
 *
 */
FeatureStore.prototype.addFeatures = function (features) {
  features.map(featureHolder).forEach(holder => (this.features[holder.id] = holder))
  this.emit('addfeatures', ({ features }))
}


/**
 *
 */
FeatureStore.prototype.center = function (key) {
  const extent = this.feature(key)?.getGeometry()?.getExtent()
  return Extent.getCenter(extent)
}


/**
 *
 */
FeatureStore.prototype.feature = function (key) {
  return this.features[key].feature
}
