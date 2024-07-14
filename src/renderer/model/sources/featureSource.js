import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import VectorSource from 'ol/source/Vector'
import * as ID from '../../ids'
import styles from '../../ol/style/styles'
import { format } from '../../ol/format'
import { flat, select } from '../../../shared/signal'
import { setCoordinates } from '../geometry'
import keyequals from '../../ol/style/keyequals'
import isEqual from 'react-fast-compare'

/**
 * Read features from GeoJSON to ol/Feature and
 * create input signals for style calculation.
 */
const readFeature = R.curry((state, source) => {
  const feature = format.readFeature(source)
  const featureId = feature.getId()
  const layerId = ID.layerId(featureId)
  const { geometry, ...properties } = feature.getProperties()

  feature.$ = {

    // A word of caution: It is strongly adviced to NOT use feature signal
    // DIRECTLY to derive style! Setting the featues style will update the
    // feature's revision and thus lead to a infinate loop.
    // Always make sure to extract relevant information from feature into
    // new signals which conversely are only updated when this information
    // has actually changed.
    //
    properties: Signal.of(properties, { equals: isEqual }),
    geometry: Signal.of(geometry, { equals: keyequals() }),
    globalStyle: Signal.of(state.styles[ID.defaultStyleId]),
    layerStyle: Signal.of(state.styles[ID.styleId(layerId)] ?? {}),
    featureStyle: Signal.of(state.styles[ID.styleId(featureId)] ?? {}),
    centerResolution: Signal.of(state.resolution),
    selectionMode: Signal.of('default')
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
    target.$.geometry(target.getGeometry())
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
  flat,
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
  const { store, selection } = services
  const state = {}

  const source = new VectorSource({
    features: [],
    useSpatialIndex: false,
    strategy: function (extent, resolution) {
      if (state.resolution !== resolution) {
        state.resolution = resolution
        this.getFeatures().map(feature => feature.$.centerResolution(resolution))
      }
      return [extent]
    }
  })

  const getFeatureById = source.getFeatureById.bind(source)
  const getFeaturesById = ids => ids.map(getFeatureById).filter(Boolean)

  ;(async () => {
    state.styles = await store.dictionary('style+')
    const tuples = [
      ...await store.tuples(ID.FEATURE_SCOPE),
      ...await store.tuples(ID.MARKER_SCOPE),
      ...await store.tuples(ID.MEASURE_SCOPE)
    ]

    const features = tuples
      .map(([id, value]) => ({ id, ...value }))
      .map(readFeature(state))
    source.addFeatures(features)
  })()

  // ==> batch event handling

  const events = operations(Signal.fromListeners(['batch'], store))
  const [globalStyle, layerStyle, featureStyle, feature] = selectEvent(events)

  globalStyle.on(({ value }) => {
    source.getFeatures().forEach(feature => feature.$.globalStyle(value))
  })

  layerStyle.on(({ type, key, value }) => {
    const layerId = ID.layerId(key)
    if (type === 'del') delete state.styles[key]
    source.getFeatures()
      .filter(feature => ID.layerId(feature.getId()) === layerId)
      .forEach(feature => feature.$.layerStyle(type === 'put' ? value : {}))
  })

  featureStyle.on(({ type, key, value }) => {
    const featureId = ID.featureId(key)
    const feature = getFeatureById(featureId)
    if (type === 'del') delete state.styles[key]
    if (feature) feature.$.featureStyle(type === 'put' ? value : {})
  })

  feature.on(({ type, key, value }) => {
    let feature = getFeatureById(key)
    if (type === 'del') source.removeFeature(feature)
    else if (feature) feature.$.properties(value.properties)
    else {
      feature = readFeature(state, { id: key, ...value })
      source.addFeature(feature)
    }
  })

  // <== batch event handling

  selection.on('selection', ({ deselected }) => {
    const mode = selection.selected().length > 1
      ? 'multiselect'
      : 'singleselect'

    const apply = mode => feature => feature.$.selectionMode(mode)
    getFeaturesById(deselected).map(apply('default'))
    getFeaturesById(selection.selected()).map(apply(mode))
  })

  return source
}
