import * as R from 'ramda'
import util from 'util'
import GeoJSON from 'ol/format/GeoJSON'
import * as Extent from 'ol/extent'
import { Circle, Fill, Stroke, Style } from 'ol/style'
import Emitter from '../../shared/emitter'
import { debounce, batch } from '../../shared/debounce'
import * as ID from '../ids'
import { FeatureHolder } from './FeatureHolder'

const styleFactory = () => {
  const fill = new Fill({ color: 'rgba(255,255,255,0.4)' })
  const stroke = new Stroke({ color: 'red', width: 3 })
  const image = new Circle({ fill, stroke, radius: 5 })
  return [new Style({ image, fill, stroke })]
}

/* eslint-disable no-unused-vars */
const DEFAULT_STYLE = styleFactory()
/* eslint-enable no-unused-vars */

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

// Style Construction
//
// Inputs:
// feature :: ol/Feature
// resolution :: Number
// mode :: 'default' | 'singleselect' | 'multiselect'
// properties/style :: {k: v} -- colors incl. scheme, line widths, etc.
// properties/smooth :: Boolean
//
// Intermediates:
// properties/feature :: [{String: String}] <- [feature]
// geometry/feature :: ol/Geometry <- [feature]
// geometry/simplified :: jsts/Geometry <- [geometry/feature]
// geometry/smooth :: jsts/Geometry <- [properties/smooth, geometry/simplified]
// style/primary :: [ol/Style] <- [mode, resolution, geometry/smooth]
// style/label :: [ol/Style] <- [properties/feature]
// geometry/clipped :: jsts/Geometry ::
// style/handle :: [ol/Style] <- [mode, geometry/simplified]
// style/guide :: [ol/Style] <- [mode, geometry/simplified]
//
// Output:
// style :: [ol/Style] <- [style/primary, style/label, style/handle, style/guide]

const MODE = 'mode'
const STYLE_LAYER = 'style_layer'
const STYLE_FEATURE = 'style_feature'



export function FeatureStore (store, selection) {
  this.store = store
  this.features = {}
  this.styleProps = {}

  ;(async () => {
  })()

  // TODO: rather debounce in sources?
  const debouncedHandler = batch(debounce(32), this.batch.bind(this))
  store.on('batch', ({ operations }) => debouncedHandler(operations))

  selection.on('selection', ({ deselected, selected }) => {
    deselected.forEach(key => {
      if (this.features[key]) this.features[key].apply({ [MODE]: 'default' })
    })

    const mode = selection.selected().length > 1
      ? 'multiselect'
      : 'singleselect'

    selected.forEach(key => {
      if (this.features[key]) this.features[key].apply({ [MODE]: mode })
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
  const holders = Object.values(this.features)
  const apply = obj => holder => holder.apply(obj, true)

  operations
    .filter(({ key }) => ID.isId('style+default')(key))
    .forEach(({ value }) => holders.forEach(apply({ style_default: value })))

  operations
    .filter(({ key }) => ID.isId('style+feature')(key))
    .forEach(({ key, value }) => apply({ [STYLE_FEATURE]: value })(this.features[ID.featureId(key)]))

  // TODO: dispatch layer/feature styles

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

    const feature = this.features[key].feature
    feature.setProperties({ ...feature.getProperties(), ...properties })
  })
}

/**
 *
 */
FeatureStore.prototype.addFeatures = function (features) {
  const featureHolder = this.featureHolder.bind(this)
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

FeatureStore.prototype.featureHolder = function (feature) {
  const state = { [MODE]: 'default' }
  const featureId = feature.getId()
  const layerId = ID.layerId(featureId)
  const set = key => props => (state[key] = props)
  R.when(Boolean, set('style_default'))(this.styleProps['style+default'])
  R.when(Boolean, set(STYLE_LAYER))(this.styleProps['style+' + layerId])
  R.when(Boolean, set(STYLE_FEATURE))(this.styleProps['style+' + featureId])
  const holder = new FeatureHolder(feature, state)
  return holder
}
