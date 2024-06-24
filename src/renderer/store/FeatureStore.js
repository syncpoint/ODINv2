/* eslint-disable camelcase */
import * as R from 'ramda'
import util from 'util'
import GeoJSON from 'ol/format/GeoJSON'
import * as Extent from 'ol/extent'
import Emitter from '../../shared/emitter'
import { debounce, batch } from '../../shared/debounce'
import { geometryType } from '../model/geometry'
import * as ID from '../ids'
import { reduce, rules } from '../ol/style/rules'
import crosshair from '../ol/style/crosshair'
import { stylist as measurementStyler } from '../ol/interaction/measure/style'
import * as TS from '../ol/ts'
import * as Math from '../../shared/Math'

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
  this.selection = selection
  this.features = {}
  this.styleProps = {}

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
}

util.inherits(FeatureStore, Emitter)


/**
 *
 */
FeatureStore.prototype.bootstrap = async function () {
  // On startup: load all features:
  //
  this.styleProps = Object.fromEntries(await this.store.tuples('style+'))
  await this.loadFeatures(ID.FEATURE_SCOPE)
  await this.loadFeatures(ID.MARKER_SCOPE)
  await this.loadFeatures(ID.MEASURE_SCOPE)
}

/**
 *
 */
FeatureStore.prototype.loadFeatures = async function (scope) {
  const tuples = await this.store.tuples(scope)
  const geoJSON = tuples.map(([id, feature]) => ({ id, ...feature }))
  const isValid = feature => feature?.type === 'Feature' && feature.geometry
  const [valid, invalid] = R.partition(isValid, geoJSON)
  if (invalid.length) console.warn('invalid features', invalid)
  this.addFeatures(readFeatures({ type: 'FeatureCollection', features: valid }))
}


/**
 *
 */
FeatureStore.prototype.batch = function (operations) {
  const features = Object.values(this.features)
  const apply = obj => feature => feature && feature.apply(obj, true)

  const isCandidateId = id => ID.isFeatureId(id) || ID.isMarkerId(id) || ID.isMeasureId(id)
  const candidates = operations.filter(({ key }) => isCandidateId(key))
  const [removals, other] = R.partition(({ type }) => type === 'del', candidates)
  const [updates, additions] = R.partition(({ key }) => this.features[key], other)
  this.handleRemovals(removals)
  this.handleAdditions(additions)
  this.handleUpdates(updates)

  operations
    .filter(({ key }) => key === ID.defaultStyleId)
    .forEach(({ value }) => features.forEach(apply({ globalStyle: value })))

  operations
    .filter(({ key }) => ID.isFeatureStyleId(key))
    .forEach(({ key, value }) => apply({ featureStyle: value })(this.features[ID.featureId(key)]))

  // Apply new/updated layer styles:
  //
  operations
    .filter(({ type }) => type === 'put')
    .filter(({ key }) => ID.isLayerStyleId(key))
    .forEach(({ key, value }) => {
      this.styleProps[key] = value
      const layerId = ID.layerId(key)
      Object
        .keys(this.features)
        .filter(key => ID.layerId(key) === layerId)
        .forEach(key => apply({ layerStyle: value })(this.features[key]))
    })

  // Remove deleted layer styles:
  //
  operations
    .filter(({ type }) => type === 'del')
    .filter(({ key }) => ID.isLayerStyleId(key))
    .forEach(({ key }) => {
      delete this.styleProps[key]
      const layerId = ID.layerId(key)
      Object
        .keys(this.features)
        .filter(key => ID.layerId(key) === layerId)
        .forEach(key => apply({ layerStyle: {} })(this.features[key]))
    })
}


/**
 *
 */
FeatureStore.prototype.handleAdditions = function (additions) {
  if (additions.length === 0) return
  const isValid = feature => feature?.type === 'Feature' && feature.geometry
  const features = additions
    .filter(({ value }) => isValid(value))
    .map(({ key, value }) => readFeature({ id: key, ...value }))

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
FeatureStore.prototype.center = async function (key) {
  const values = await this.store.values([key])
  if (values.length !== 1) return
  const feature = readFeature(values[0])
  const extent = feature.getGeometry()?.getExtent()
  return Extent.getCenter(extent)
}


/**
 *
 */
FeatureStore.prototype.feature = function (key) {
  return this.features[key]
}


/**
 *
 */
FeatureStore.prototype.wrap = function (feature) {
  const id = feature.getId()
  if (ID.isFeatureId(id)) return this.wrapFeature(feature)
  else if (ID.isMarkerId(id)) return this.wrapMarker(feature)
  else if (ID.isMeasureId(id)) return this.wrapMeasurement(feature)
  else return feature
}


/**
 *
 */
FeatureStore.prototype.wrapFeature = function (feature) {
  const type = geometryType(feature.getGeometry())
  if (!rules[type]) console.warn('[style] unsupported geometry', type)

  let state = {
    TS,
    ...Math,
    mode: 'default',
    rules: rules[type] || [],
    layerStyle: {},
    featureStyle: {}
  }

  const featureId = feature.getId()
  const layerId = ID.layerId(featureId)
  const set = key => props => (state[key] = props)
  R.when(Boolean, set('globalStyle'))(this.styleProps[ID.defaultStyleId])
  R.when(Boolean, set('layerStyle'))(this.styleProps['style+' + layerId])
  R.when(Boolean, set('featureStyle'))(this.styleProps['style+' + featureId])

  feature.setStyle((feature, resolution) => {
    const { geometry: definingGeometry, ...properties } = feature.getProperties()
    state = reduce(state, {
      definingGeometry,
      properties,
      centerResolution: resolution,
      geometryKey: `${definingGeometry.ol_uid}:${definingGeometry.getRevision()}`,
      geometryType: type
    })

    return state.style
  })

  feature.apply = (obj, forceUpdate) => {
    state = reduce(state, obj)
    if (forceUpdate) feature.changed()
  }

  return feature
}


/**
 *
 */
FeatureStore.prototype.wrapMarker = function (feature) {
  const defaultStyle = crosshair('black')
  const selectedStyle = crosshair('red')

  feature.apply = () => {}
  feature.setStyle(feature => {
    return this.selection.isSelected(feature.getId())
      ? selectedStyle
      : defaultStyle
  })

  return feature
}


/**
 *
 */
FeatureStore.prototype.wrapMeasurement = function (feature) {
  const isSelected = feature => this.selection.isSelected(feature.getId())

  feature.apply = () => {}
  feature.setStyle(measurementStyler(isSelected))

  return feature
}
