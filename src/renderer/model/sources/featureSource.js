import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import VectorSource from 'ol/source/Vector'
import bbox from 'geojson-bbox'
import isEqual from 'react-fast-compare'
import * as ID from '../../ids'
import { format } from '../../ol/format'
import FlatRBush from './FlatRBush'
import readFeature from './readFeature'
import operations from './operations'
import selectEvent from './selectEvent'

// TODO: move to library
Signal.deferred = arg => {
  const s = Signal.of()
  ;(async () => s(await (typeof arg === 'function' ? arg() : arg)))()
  return s
}

/**
 *
 */
export const featureSource = services => {
  const { store, selection } = services
  const state = {}

  const $extent = Signal.of(undefined, { equals: isEqual })
  const $indexEvent = Signal.of({ type: 'noop' })

  const $initialIndex = Signal.deferred(async () => {
    const tree = new FlatRBush()
    const items = [
      ...await store.tuples(ID.FEATURE_SCOPE),
      ...await store.tuples(ID.MARKER_SCOPE),
      ...await store.tuples(ID.MEASURE_SCOPE)
    ].map(([id, feature]) => [...bbox(feature), id])
    tree.load(items)
    return tree
  })

  const $updatedIndex = Signal.lift((tree, event) => {
    switch (event.type) {
      case 'insert': tree.insert(event.item); break
      case 'remove': tree.remove(event.item, event.equals); break
    }
    return tree
  }, $initialIndex, $indexEvent)

  // RBush stays the same and is only mutated.
  $updatedIndex.equals = R.F

  const fetch = async (extent, resolution) => {
    $extent(extent)

    if (!state.styles) state.styles = await store.dictionary('style+')

    if (state.resolution !== resolution) {
      state.resolution = resolution
      source.getFeatures().map(feature => feature.$.centerResolution(resolution))
    }
  }

  const source = new VectorSource({
    features: [],
    useSpatialIndex: false,
    // like ol/loadingstrategy/bbox
    strategy: function (extent, resolution) {
      fetch(extent, resolution)
      return [extent]
    }
  })

  const $search = $updatedIndex.map(rbush => extent => rbush.search({
    minX: extent[0],
    minY: extent[1],
    maxX: extent[2],
    maxY: extent[3]
  }).map(R.last))

  const $hits = $extent.ap($search)

  const loadFeatures = R.compose(
    R.map(ids => ids.filter(id => !source.getFeatureById(id))),
    R.map(ids => store.tuples(ids)),
    R.map(async tuples => (await tuples).map(([id, value]) => ({ id, ...value }))),
    R.map(async entries => (await entries).map(readFeature(state)))
  )

  const $additions = Signal.transduce(loadFeatures, $hits)

  const $removals = $hits.map(ids => {
    const loaded = source.getFeatures().map(x => x.getId())
    return R.difference(loaded, ids).map(id => source.getFeatureById(id))
  })

  $additions.on(async features => source.addFeatures(await features))
  $removals.on(source.removeFeatures.bind(source))

  const getFeatureById = source.getFeatureById.bind(source)
  const getFeaturesById = ids => ids.map(getFeatureById).filter(Boolean)

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
    const loadedFeature = getFeatureById(key)
    if (type === 'del') {
      const item = [...loadedFeature.getGeometry().getExtent(), loadedFeature.getId()]
      $indexEvent({ type: 'remove', item, equals: (a, b) => a[4] === b[4] })

      source.removeFeature(loadedFeature)
    } else if (loadedFeature) {
      loadedFeature.setProperties(value.properties)
      // It is possible that only properties have changed.
      // Don't set null/undefined geometry!
      const geometry = format.readGeometry(value.geometry)
      if (geometry) loadedFeature.setGeometry(geometry)
    } else {
      const feature = readFeature(state, { id: key, ...value })
      const item = [...feature.getGeometry().getExtent(), feature.getId()]
      $indexEvent({ type: 'insert', item })
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
