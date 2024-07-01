/* eslint-disable camelcase */
import * as R from 'ramda'
import util from 'util'
import GeoJSON from 'ol/format/GeoJSON'
import * as Extent from 'ol/extent'
import Signal from '@syncpoint/signal'
import Emitter from '../../shared/emitter'
import { setCoordinates } from '../model/geometry'
import { flatten, select, once } from '../../shared/signal'
import * as ID from '../ids'
import style from '../ol/style/styles'


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

// Batch operations order:
//   0 - (del, style+)
//   1 - (del, feature)
//   2 - (put, feature)
//   3 - (put, style+)
const ord = R.cond([
  [R.both(R.propEq('del', 'type'), R.compose(R.startsWith('style+'), R.prop('key'))), R.always(0)],
  [R.both(R.propEq('del', 'type'), R.compose(R.startsWith(ID.FEATURE_SCOPE), R.prop('key'))), R.always(1)],
  [R.both(R.propEq('put', 'type'), R.compose(R.startsWith(ID.FEATURE_SCOPE), R.prop('key'))), R.always(2)],
  [R.both(R.propEq('del', 'type'), R.compose(R.startsWith('style+'), R.prop('key'))), R.always(3)],
  [R.T, R.always(4)]
])

const push = (acc, [key, value]) => {
  acc.push({ type: 'put', key, value })
  return acc
}

/**
 *
 */
export function FeatureStore (store, selection, emitter) {
  this.store = store
  this.selection = selection
  this.emitter = emitter
  this.features = {}
  this.styleProperties = {} // global (default), layer and feature style properties

  // FIXME: Signal should support on/off
  store.addEventListener = (type, handler) => store.on(type, handler)
  store.removeEventListener = (type, handler) => store.off(type, handler)
  selection.addEventListener = (type, handler) => selection.on(type, handler)
  selection.removeEventListener = (type, handler) => selection.off(type, handler)
  emitter.addEventListener = (type, handler) => emitter.on(type, handler)
  emitter.removeEventListener = (type, handler) => emitter.off(type, handler)

  const operations = R.compose(
    flatten,
    R.map(R.sort((a, b) => ord(a) - ord(b))),
    R.map(R.prop('operations'))
  )(Signal.fromListeners(['batch'], store))

  const [
    globalStyle,
    featureStyle,
    layerStyle,
    feature
  ] = select([
    R.propEq(ID.defaultStyleId, 'key'),
    R.compose(ID.isFeatureStyleId, R.prop('key')),
    R.compose(ID.isLayerStyleId, R.prop('key')),
    R.compose(isCandidateId, R.prop('key'))
  ], operations)

  globalStyle.on(({ value }) => {
    Object.values(this.features).forEach(feature => feature.$.globalStyle(value))
  })

  featureStyle.on(({ type, key, value }) => {
    const feature = this.features[ID.featureId(key)]
    if (feature) feature.$.featureStyle(type === 'put' ? value : {})
  })

  layerStyle.on(({ type, key, value }) => {
    const layerId = ID.layerId(key)
    Object.entries(this.features)
      .filter(([key]) => ID.layerId(key) === layerId)
      .forEach(([, feature]) => feature.$.layerStyle(type === 'put' ? value : {}))
  })

  const [
    featureRemoval,
    featureUpdate,
    featureAddition
  ] = select([
    R.propEq('del', 'type'),
    ({ key }) => this.features[key],
    R.T
  ], feature)

  const isValid = feature => feature?.type === 'Feature' && feature.geometry

  const trim = properties => {
    const { geometry, ...rest } = properties
    return geometry
      ? properties
      : rest
  }

  featureRemoval.on(({ key }) => {
    const features = [this.features[key]]
    delete this.features[key]
    this.emit('removefeatures', ({ features }))
  })

  featureAddition
    .map(({ key, value }) => ({ id: key, ...value }))
    .map(readFeature)
    // .filter(feature => Geometry.geometryType(feature) === 'Polygon')
    // .filter(feature => feature.getGeometry().getCoordinates()[0].length > 80)
    // .filter(feature => feature.getProperties().sidc.startsWith('M'))
    .map(this.wrapFeature.bind(this))
    .on(feature => this.features[feature.getId()] = feature)

  featureUpdate.on(({ key, value }) => {
    const properties = isGeometry(value)
      ? { geometry: readGeometry(value) }
      : trim(readFeature(value).getProperties())

    const feature = this.features[key]
    feature.setProperties({ ...feature.getProperties(), ...properties })
  })

  // TODO: limit to features
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
    flatten,
    R.map(modes)
  )($selection)

  // $mode.on(console.log)

  // selection.on('selection', ({ deselected, selected }) => {
  //   deselected.forEach(key => {
  //     if (this.features[key]) this.features[key].apply({ mode: 'default' })
  //   })

  //   const mode = selection.selected().length > 1
  //     ? 'multiselect'
  //     : 'singleselect'

  //   selected.forEach(key => {
  //     if (this.features[key]) this.features[key].apply({ mode })
  //   })
  // })

  const centerResolution = Signal.fromListeners(['view/resolution'], emitter)
  centerResolution.on(({ resolution }) => {
    this.resolution = resolution
    Object.values(this.features).forEach(feature => feature.$.centerResolution(resolution))
  })
}

util.inherits(FeatureStore, Emitter)

/**
 *
 */
FeatureStore.prototype.bootstrap = async function () {

  // pre-load and store global style
  this.globalStyle = await this.store.value(ID.defaultStyleId)

  const reduce = async (prefix, fn, acc) => {
    const db = this.store.db
    const it = db.iterator({ gte: `${prefix}`, lte: `${prefix}\xff` })
    for await (const entry of it) acc = fn(acc, entry)
    return acc
  }

  // styles: Only needed while loading features.
  const operations = await reduce('style+', push, [])
  await reduce(ID.FEATURE_SCOPE, push, operations)
  this.store.emit('batch', { operations })
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
FeatureStore.prototype.wrapFeature = function (feature) {
  const featureId = feature.getId()
  const layerId = ID.layerId(featureId)

  feature.$ = {
    feature: Signal.of(feature),
    globalStyle: Signal.of(this.globalStyle),
    layerStyle: Signal.of({}),
    featureStyle: Signal.of({}),
    centerResolution: Signal.of(this.resolution)
  }

  const $style = style(feature)
  $style.on(feature.setStyle.bind(feature))
  once(() => this.emit('addfeatures', { features: [feature] }), $style)


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

  return feature
}
