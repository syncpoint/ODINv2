import * as R from 'ramda'
import util from 'util'
import GeoJSON from 'ol/format/GeoJSON'
import * as Extent from 'ol/extent'
import Emitter from '../../shared/emitter'
import { debounce, batch } from '../../shared/debounce'
import * as ID from '../ids'
import * as StyleRules from './StyleRules'
import { reduce } from './StyleRules'


const format = new GeoJSON({
  dataProjection: 'EPSG:3857',
  featureProjection: 'EPSG:3857'
})

/**
 * Note: If source does not include a geometry, geometry of resulting feature is `null`.
 */
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
export function FeatureStore (store, selection) {
  this.store = store
  this.features = {}
  this.styleProps = {}

  // TODO: rather debounce in sources?
  const debouncedHandler = batch(debounce(32), this.batch.bind(this))
  store.on('batch', ({ operations }) => debouncedHandler(operations))

  selection.on('selection', ({ deselected, selected }) => {
    deselected.forEach(key => {
      if (this.features[key]) this.features[key].apply({ mode: 'default' })
    })

    const mode = selection.selected().length > 1
      ? 'multiselect'
      : 'singleselect'

    selected.forEach(key => {
      if (this.features[key]) this.features[key].apply({ mode })
    })
  })

  // On startup: load all features:
  window.requestIdleCallback(async () => {
    this.styleProps = Object.fromEntries(await store.tuples('style+'))
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
  const features = Object.values(this.features)
  const apply = obj => feature => feature.apply(obj, true)

  operations
    .filter(({ key }) => ID.isId('style+default')(key))
    .forEach(({ value }) => features.forEach(apply({ style_default: value })))

  operations
    .filter(({ key }) => ID.isId('style+feature')(key))
    .forEach(({ key, value }) => apply({ style_feature: value })(this.features[ID.featureId(key)]))

  // TODO: dispatch layer styles

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
  const features = removals.map(({ key }) => this.features[key])
  removals.forEach(({ key }) => delete this.features[key])
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

  // We don't want null geometry overwrite existing one
  // in case only feature properties were updated (JSON).
  //
  const trim = properties => {
    const { geometry, ...rest } = properties
    return geometry
      ? properties
      : rest
  }

  updates.forEach(({ key, value }) => {
    const properties = isGeometry(value)
      ? { geometry: readGeometry(value) }
      : trim(readFeature(value).getProperties())

    const feature = this.features[key]
    feature.setProperties({ ...feature.getProperties(), ...properties })
  })
}

/**
 *
 */
FeatureStore.prototype.addFeatures = function (features) {
  const wrap = this.wrap.bind(this)
  features.map(wrap).forEach(feature => (this.features[feature.getId()] = feature))
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
  return this.features[key]
}

FeatureStore.prototype.wrap = function (feature) {
  let state = {
    mode: 'default',
    rules: StyleRules.LineString
  }

  const featureId = feature.getId()
  const layerId = ID.layerId(featureId)
  const set = key => props => (state[key] = props)
  R.when(Boolean, set('style_default'))(this.styleProps['style+default'])
  R.when(Boolean, set('style_layer'))(this.styleProps['style+' + layerId])
  R.when(Boolean, set('style_feature'))(this.styleProps['style+' + featureId])

  feature.setStyle((feature, resolution) => {
    const { geometry, ...properties } = feature.getProperties()
    state = reduce(state, {
      geometry,
      properties,
      resolution,
      geometry_key: `${geometry.ol_uid}:${geometry.getRevision()}`
    })

    return state.style
  })

  feature.apply = (obj, forceUpdate) => {
    state = reduce(state, obj)
    if (forceUpdate) feature.changed()
  }

  return feature
}
