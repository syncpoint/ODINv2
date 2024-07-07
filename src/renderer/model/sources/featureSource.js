import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import * as ID from '../../ids'
import styles from '../../ol/style/styles'
import { flatten, select } from '../../../shared/signal'
import { setCoordinates } from '../geometry'
import keyequals from '../../ol/style/keyequals'

const format = new GeoJSON({
  dataProjection: 'EPSG:3857',
  featureProjection: 'EPSG:3857'
})

/**
 * Read features from GeoJSON to ol/Feature and
 * create input signals for style calculation.
 */
const readFeature = R.curry((state, source) => {
  const feature = format.readFeature(source)
  const featureId = feature.getId()
  const layerId = ID.layerId(featureId)

  feature.$ = {

    // A word of caution: It is strongly adviced to NOT use feature signal
    // DIRECTLY to derive style! Setting the featues style will update the
    // feature's revision and thus lead to a infinate loop.
    // Always make sure to extract relevant information from feature into
    // new signals which conversely are only updated when this information
    // has actually changed.
    //
    feature: Signal.of(feature, { equals: keyequals() }),
    globalStyle: Signal.of(state.styles[ID.defaultStyleId]),
    layerStyle: Signal.of(state.styles[ID.styleId(layerId)] ?? {}),
    featureStyle: Signal.of(state.styles[ID.styleId(featureId)] ?? {}),
    resolution: Signal.of(state.resolution)
  }

  feature.$.styles = styles(feature)
  feature.$.styles.on(feature.setStyle.bind(feature))

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

  feature.on('change', ({ target }) => {
    target.$.feature(target)
  })

  return feature
})

// Batch operations order:
//   0 - (del, style+)
//   1 - (del, feature)
//   2 - (put, style+)
//   3 - (put, feature)
//   4 - other
const ord = R.cond([
  [R.both(R.propEq('del', 'type'), R.compose(R.startsWith('style+'), R.prop('key'))), R.always(0)],
  [R.both(R.propEq('del', 'type'), R.compose(R.startsWith(ID.FEATURE_SCOPE), R.prop('key'))), R.always(1)],
  [R.both(R.propEq('put', 'type'), R.compose(R.startsWith('style+'), R.prop('key'))), R.always(2)],
  [R.both(R.propEq('put', 'type'), R.compose(R.startsWith(ID.FEATURE_SCOPE), R.prop('key'))), R.always(3)],
  [R.T, R.always(4)]
])

const isCandidateId = id => ID.isFeatureId(id) || ID.isMarkerId(id) || ID.isMeasureId(id)

const operations = R.compose(
  flatten,
  R.map(R.sort((a, b) => ord(a) - ord(b))),
  R.map(R.prop('operations'))
)

const selectEvent = select([
  R.propEq(ID.defaultStyleId, 'key'),
  R.compose(ID.isLayerStyleId, R.prop('key')),
  R.compose(ID.isFeatureStyleId, R.prop('key')),
  R.compose(isCandidateId, R.prop('key'))
])

/**
 *
 */
export const featureSource = services => {
  const { store } = services
  const state = {}

  const source = new VectorSource({
    features: [],
    useSpatialIndex: false,
    strategy: (extent, resolution) => {
      state.resolution = resolution
      return [extent]
    }
  })

  ;(async () => {
    state.styles = await store.dictionary('style+')
    const features = (await store.tuples(ID.FEATURE_SCOPE))
      .map(([id, value]) => ({ id, ...value }))
      .map(readFeature(state))
    source.addFeatures(features)
  })()

  // ==> batch event handling

  const events = operations(Signal.fromListeners(['batch'], store))
  const [globalStyle, layerStyle, featureStyle, feature] = selectEvent(events)

  globalStyle.on(({ value }) => {
    console.log(value)
    source.getFeatures().forEach(feature => feature.$.globalStyle(value))
  })

  layerStyle.on(({ type, key, value }) => {
    const layerId = ID.layerId(key)
    source.getFeatures()
      .filter(feature => ID.layerId(feature.getId()) === layerId)
      .forEach(feature => feature.$.layerStyle(type === 'put' ? value : {}))
  })

  featureStyle.on(({ type, key, value }) => {
    const featureId = ID.featureId(key)
    const feature = source.getFeatureById(featureId)
    if (feature) feature.$.featureStyle(type === 'put' ? value : {})
  })

  feature.on(({ type, key, value }) => {
    // TODO: ...
  })

  // <== batch event handling

  return source
}
