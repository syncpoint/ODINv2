import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import * as ID from '../../ids'
import styles from '../../ol/style/styles'
import { flatten, select } from '../../../shared/signal'

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
    feature: Signal.of(feature),
    globalStyle: Signal.of(state.styles[ID.defaultStyleId]),
    layerStyle: Signal.of(state.styles[ID.styleId(layerId)] ?? {}),
    featureStyle: Signal.of(state.styles[ID.styleId(featureId)] ?? {}),
    centerResolution: Signal.of(state.resolution)
  }

  feature.$.styles = styles(feature)
  feature.$.styles.on(feature.setStyle.bind(feature))

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

/**
 *
 */
export const featureSource = services => {
  const { store } = services
  const state = { loaded: false }

  // FIXME: Signal should support on/off
  store.addEventListener = (type, handler) => store.on(type, handler)
  store.removeEventListener = (type, handler) => store.off(type, handler)

  const operations = R.compose(
    flatten,
    R.map(R.sort((a, b) => ord(a) - ord(b))),
    R.map(R.prop('operations'))
  )(Signal.fromListeners(['batch'], store))

  const [
    globalStyle,
    layerStyle,
    featureStyle,
    feature
  ] = select([
    R.propEq(ID.defaultStyleId, 'key'),
    R.compose(ID.isLayerStyleId, R.prop('key')),
    R.compose(ID.isFeatureStyleId, R.prop('key')),
    R.compose(isCandidateId, R.prop('key'))
  ], operations)

  globalStyle.on(({ value }) => {
    indexedSource.getFeatures().forEach(feature => feature.$.globalStyle(value))
  })

  layerStyle.on(({ type, key, value }) => {
    const layerId = ID.layerId(key)
    indexedSource.getFeatures()
      .filter(feature => ID.layerId(feature.getId()) === layerId)
      .forEach(feature => feature.$.layerStyle(type === 'put' ? value : {}))
  })

  featureStyle.on(({ type, key, value }) => {
    const feature = indexedSource.getFeatureById(key)
    if (feature) feature.$.featureStyle(type === 'put' ? value : {})
  })

  // Source with spatial index holding all features.
  const indexedSource = new VectorSource({
    useSpatialIndex: true,
    features: []
  })

  // Fetch all features and styles on initial load.
  const populate = async () => {
    state.loaded = true
    state.styles = await store.dictionary('style+')
    const features = (await store.tuples(ID.FEATURE_SCOPE))
      .map(([id, value]) => ({ id, ...value }))
      .map(readFeature(state))
    indexedSource.addFeatures(features)
  }

  const loader = async extent => {
    if (!state.loaded) await populate()

    // Diff features currently in view and features from extent.
    const loaded = source.getFeatures()
    const loading = indexedSource.getFeaturesInExtent(extent)
    const difference = R.differenceWith((a, b) => a.getId() === b.getId())
    source.removeFeatures(difference(loaded, loading))
    source.addFeatures(difference(loading, loaded))

    // Apply resolution to all features currently in view:
    source.getFeatures()
      .filter(feature => feature.$.resolution)
      .forEach(feature => feature.$.resolution(state.resolution))
  }

  // Workaround to always trigger loader for updated extent.
  // See also: https://gis.stackexchange.com/questions/322681/openlayers-refresh-vector-source-with-bbox-strategy-after-map-moved

  const strategy = (extent, resolution) => {
    const bbox = extent.join(',')
    if (bbox === state.bbox) return []
    state.bbox = bbox
    state.resolution = resolution
    loader(extent)
    return []
  }

  const source = new VectorSource({
    features: [],
    useSpatialIndex: false,
    loader: () => {},
    strategy
  })

  return source
}
