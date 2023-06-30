/* eslint-disable camelcase */
import * as R from 'ramda'
import util from 'util'
import GeoJSON from 'ol/format/GeoJSON'
import * as Extent from 'ol/extent'
import Signal from '@syncpoint/signal'
import Emitter from '../../shared/emitter'
import { debounce, batch } from '../../shared/debounce'
import { geometryType, setCoordinates } from '../model/geometry'
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

const isPutOp = ({ type }) => type === 'put'
const isDeleteOp = ({ type }) => type === 'del'
const isDefaultStyle = ({ key }) => key === ID.defaultStyleId
const isLayerStyle = ({ key }) => ID.isLayerStyleId(key)
const isFeatureLike = ({ key }) => ID.isFeatureId(key) || ID.isMarkerId(key) || ID.isMeasureId(key)

/**
 *
 */
export function FeatureStore (store, selection) {
  this.store = store
  this.selection = selection
  this.features = {}
  this.styles = {} // default/layer styles

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
}

util.inherits(FeatureStore, Emitter)

/**
 *
 */
FeatureStore.prototype.bootstrap = async function () {
  this.batch([
    ...await this.store.tuples('style+'),
    ...await this.store.tuples(ID.FEATURE_SCOPE),
    ...await this.store.tuples(ID.MARKER_SCOPE),
    ...await this.store.tuples(ID.MEASURE_SCOPE)
  ].map(([key, value]) => ({ type: 'put', key, value })))
}

/**
 *
 */
FeatureStore.prototype.batch = function (operations) {
  const existsFeature = ({ key }) => this.features[key]

  const applyGlobalStyle = features => ({ value }) => {
    this.styles[ID.defaultStyleId] = value
    Object.values(features)
      .forEach(feature => feature.apply({ globalStyle: value }, true))
  }

  const applyLayerStyle = features => ({ key, value }) => {
    this.styles[key] = value
    const layerId = ID.layerId(key)
    Object
      .keys(features)
      .filter(key => ID.layerId(key) === layerId)
      .forEach(key => features[key].apply({ layerStyle: value }, true))
  }

  const trim = properties => {
    const { geometry, ...rest } = properties
    return geometry ? properties : rest
  }

  const updateFeature = features => ({ key, value }) => {
    // We don't want null geometry overwrite existing one
    // in case only feature properties were updated (JSON).
    //
    const properties = isGeometry(value)
      ? { geometry: readGeometry(value) }
      : trim(readFeature(value).getProperties())

    // FIXME: properties with null value won't override initial properties.
    const feature = features[key]
    feature.setProperties({ ...feature.getProperties(), ...properties })
  }

  const isValid = feature => feature?.type === 'Feature' && feature.geometry

  const addFeature = features => ({ key, value }) => {
    if (!isValid(value)) return
    features[key] = this.wrap(readFeature({ id: key, ...value }))
    this.emit('addfeatures', ({ features: [features[key]] }))
  }

  const removeFeature = features => ({ key }) => {
    const feature = features[key]
    delete features[key]
    this.emit('removefeatures', ({ features: [feature] }))
  }

  const handler = R.cond([
    [R.allPass([isFeatureLike, isPutOp, existsFeature]), updateFeature(this.features)],
    [R.allPass([isFeatureLike, isPutOp]), addFeature(this.features)],
    [R.allPass([isFeatureLike, isDeleteOp]), removeFeature(this.features)],
    [isDefaultStyle, applyGlobalStyle(this.features)],
    [R.allPass([isLayerStyle, isPutOp]), applyLayerStyle(this.features)],
    [R.T, () => {}]
  ])

  operations.forEach(operation => handler(operation))
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

  const layerId = ID.layerId(feature.getId())
  const layerStyleId = ID.styleId(layerId)

  feature.renderState = {
    TS,
    ...Math,
    mode: 'default',
    rules: rules[type] || [],
    globalStyle: this.styles[ID.defaultStyleId] || {},
    layerStyle: this.styles[layerStyleId] || {},
    featureStyle: {} // unused
  }

  feature.internalChange = Signal.of(false)
  feature.setStyle((feature, resolution) => {
    const { geometry: definingGeometry, ...properties } = feature.getProperties()
    feature.renderState = reduce(feature.renderState, {
      definingGeometry,
      properties,
      centerResolution: resolution,
      geometryKey: `${definingGeometry.ol_uid}:${definingGeometry.getRevision()}`,
      geometryType: type
    })

    return feature.renderState.style
  })

  feature.updateCoordinates = coordinates => {
    feature.internalChange(true)
    setCoordinates(feature.getGeometry(), coordinates)
    feature.internalChange(false)
  }

  feature.commit = () => {
    // Event must be deferred so that event handler has a chance
    // to update to a new state (drag -> selected).
    setTimeout(() => feature.dispatchEvent({ type: 'change', target: feature }))
  }

  feature.apply = (obj, forceUpdate) => {
    feature.renderState = reduce(feature.renderState, obj)
    if (forceUpdate) feature.changed()
  }

  // Also wrap clones:
  const clone = feature.clone
  feature.clone = () => this.wrapFeature(clone.call(feature))
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
