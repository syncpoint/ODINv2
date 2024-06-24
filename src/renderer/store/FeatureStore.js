/* eslint-disable camelcase */
import * as R from 'ramda'
import util from 'util'
import GeoJSON from 'ol/format/GeoJSON'
import * as Extent from 'ol/extent'
import Signal from '@syncpoint/signal'
import Emitter from '../../shared/emitter'
import { geometryType, setCoordinates } from '../model/geometry'
import * as ID from '../ids'
import { reduce, rules } from '../ol/style/rules'
import crosshair from '../ol/style/crosshair'
import { stylist as measurementStyler } from '../ol/interaction/measure/style'
import * as TS from '../ol/ts'
import * as Math from '../../shared/Math'

Signal.split = (conditions, signal) => {
  const outputs = conditions.map(() => Signal.of())
  signal.on(value => {
    const match = condition => condition(value)
    outputs[conditions.findIndex(match)]?.(value)
  })
  return outputs
}

Signal.flatten = signal => {
  const output = Signal.of()
  signal.on(v => (Array.isArray(v) ? v : [v]).forEach(output))
  return output
}

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

const isCandidateId = id => ID.isFeatureId(id) || ID.isMarkerId(id) || ID.isMeasureId(id)

const isGeometry = value => {
  if (!value) return false
  else if (typeof value !== 'object') return false
  else {
    if (!value.type) return false
    else if (!value.coordinates && !value.geometries) return false
    return true
  }
}

const apply = options => feature => feature && feature.apply(options, true)


/**
 *
 */
export function FeatureStore (store, selection) {
  this.store = store
  this.selection = selection
  this.features = {}
  this.styleProps = {}

  // FIXME: Signal should support on/off
  store.addEventListener = (type, handler) => store.on(type, handler)
  store.removeEventListener = (type, handler) => store.off(type, handler)
  selection.addEventListener = (type, handler) => selection.on(type, handler)
  selection.removeEventListener = (type, handler) => selection.off(type, handler)

  const $operations = R.compose(
    Signal.flatten,
    R.map(R.prop('operations'))
  )(Signal.fromListeners(['batch'], store))

  const [
    $globalStyle,
    $featureStyle,
    $layerStyle,
    $feature
  ] = Signal.split([
    R.propEq(ID.defaultStyleId, 'key'),
    R.compose(ID.isFeatureStyleId, R.prop('key')),
    R.compose(ID.isLayerStyleId, R.prop('key')),
    R.compose(isCandidateId, R.prop('key'))
  ], $operations)

  $globalStyle.on(({ value }) => Object.values(this.features).forEach(apply({ globalStyle: value })))
  $featureStyle.on(({ key, value }) => apply({ featureStyle: value })(this.features[ID.featureId(key)]))

  $featureStyle.on(console.log)

  $layerStyle.on(({ type, key, value }) => {
    if (type === 'put') this.styleProps[key] = value
    else delete this.styleProps[key]
    const layerStyle = type === 'put' ? value : {}
    const layerId = ID.layerId(key)
    Object
      .keys(this.features)
      .filter(key => ID.layerId(key) === layerId)
      .forEach(key => apply({ layerStyle })(this.features[key]))
  })

  const [
    $removal,
    $update,
    $addition
  ] = Signal.split([
    R.propEq('del', 'type'),
    ({ key }) => this.features[key],
    R.T
  ], $feature)

  const isValid = feature => feature?.type === 'Feature' && feature.geometry

  const trim = properties => {
    const { geometry, ...rest } = properties
    return geometry
      ? properties
      : rest
  }

  $removal.on(({ key }) => {
    const features = [this.features[key]]
    delete this.features[key]
    this.emit('removefeatures', ({ features }))
  })

  $addition.on(({ key, value }) => {
    if (isValid) this.addFeatures([readFeature({ id: key, ...value })])
  })

  $update.on(({ key, value }) => {
    const properties = isGeometry(value)
      ? { geometry: readGeometry(value) }
      : trim(readFeature(value).getProperties())

    const feature = this.features[key]
    feature.setProperties({ ...feature.getProperties(), ...properties })
  })

  const $selection = Signal.fromListeners(['selection'], selection)
  const modes = ({ deselected }) => {
    const selected = selection.selected()
    const mode = selected.length > 1 ? 'multiselect' : 'singleselect'
    return [
      ...deselected.map(key => [key, 'default']),
      ...selected.map(key => [key, mode])
    ]
  }

  const $mode = R.compose(
    Signal.flatten,
    R.map(modes)
  )($selection)

  $mode.on(console.log)

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

  // Use dedicated function to update feature coordinates from within
  // modify interaction. Such internal changes must not trigger ModifyEvent.

  feature.internalChange = Signal.of(false)

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
