import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import VectorSource from 'ol/source/Vector'
import isEqual from 'react-fast-compare'
import * as ID from '../../ids'
import { format } from '../../ol/format'
import readFeature from './readFeature'
import operations from './operations'
import selectEvent from './selectEvent'
import { select } from '../../../shared/signal'
import loadRBush from './loadRBush'
import updateRBush from './updateRBush'
import searchRBush from './searchRBush'

/**
 *
 */
export const featureSource = services => {
  const { store, selection } = services

  /**
   * styles :: String k, Object v => { k: v }
   * resolution :: Number
   */
  const state = {}

  const loadStyles = async state => {
    if (state.styles) return
    state.styles = await store.dictionary('style+')
  }

  const updateResolution = (state, resolution) => {
    if (state.resolution === resolution) return
    state.resolution = resolution
    source.getFeatures().map(feature => feature.$.centerResolution(resolution))
  }

  const source = new VectorSource({
    features: [],
    useSpatialIndex: false,
    // like ol/loadingstrategy/bbox
    strategy: function (extent, resolution) {
      ;(async () => {
        await loadStyles(state)
        updateResolution(state, resolution)
        $extent(extent)
      })()

      return [extent]
    }
  })

  const getFeaturesById = ids =>
    ids.map(source.getFeatureById.bind(source))
    .filter(Boolean)

  const $extent = Signal.of([], { equals: isEqual })
  const $indexEvent = Signal.of({ type: 'noop' })
  const $initialIndex = Signal.deferred(loadRBush(store))

  // RBush stays the same and is only mutated.
  const $updatedIndex = Signal.lift(updateRBush, $initialIndex, $indexEvent)
  Signal.options($updatedIndex, { equals: R.F })

  const $search = $updatedIndex.map(searchRBush)
  const $featuresInExtent = $extent.ap($search)

  const $additions = Signal.transduce(
    R.compose(
      R.map(ids => ids.filter(id => !source.getFeatureById(id))),
      R.map(ids => store.tuples(ids)),
      R.map(async tuples => (await tuples).map(([id, value]) => ({ id, ...value }))),
      R.map(async entries => (await entries).map(readFeature(state)))
    ),
    $featuresInExtent
  )

  const $removals = $featuresInExtent.map(ids => {
    const loaded = source.getFeatures().map(x => x.getId())
    return R.difference(loaded, ids).map(source.getFeatureById.bind(source))
  })

  $additions.on(async features => source.addFeatures(await features))
  $removals.on(source.removeFeatures.bind(source))

  // ==> batch event handling

  const events = operations(Signal.fromListeners(['batch'], store))
  const [$globalStyle, $layerStyle, $featureStyle, $feature] = selectEvent(events)
  const [$removeFeature, $updateFeature, $addFeature] = select([
    ({ type }) => type === 'del',
    ({ key }) => Boolean(source.getFeatureById(key)),
    R.T
  ], $feature)


  $globalStyle.on(({ value }) => {
    source.getFeatures().forEach(feature => feature.$.globalStyle(value))
  })

  $layerStyle.on(({ type, key, value }) => {
    const layerId = ID.layerId(key)
    if (type === 'del') delete state.styles[key]
    source.getFeatures()
      .filter(feature => ID.layerId(feature.getId()) === layerId)
      .forEach(feature => feature.$.layerStyle(type === 'put' ? value : {}))
  })

  $featureStyle.on(({ type, key, value }) => {
    const featureId = ID.featureId(key)
    const feature = source.getFeatureById(featureId)
    if (type === 'del') delete state.styles[key]
    if (feature) feature.$.featureStyle(type === 'put' ? value : {})
  })

  $removeFeature.on(({ key }) => {
    const feature = source.getFeatureById(key)
    const item = [...feature.getGeometry().getExtent(), feature.getId()]
    $indexEvent({ type: 'remove', item, equals: (a, b) => a[4] === b[4] })
    source.removeFeature(feature)
  })

  $updateFeature.on(({ key, value }) => {
    const feature = source.getFeatureById(key)
    feature.setProperties(value.properties)
    // It is possible that only properties have changed.
    // Don't set null/undefined geometry!
    const geometry = format.readGeometry(value.geometry)
    if (geometry) feature.setGeometry(geometry)
  })

  $addFeature.on(({ key, value }) => {
    const feature = readFeature(state, { id: key, ...value })
    const item = [...feature.getGeometry().getExtent(), feature.getId()]
    $indexEvent({ type: 'insert', item })
    source.addFeature(feature)
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
