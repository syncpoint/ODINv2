import * as R from 'ramda'
import Signal from '@syncpoint/signal'
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
import vectorSource from './vectorSource'

/**
 * featureSource :: {k: v} Services => Services -> ol/source/Vector
 *
 * Vector source for features which is kept in sync with store.
 * Only features which are contained in the current extent are held in the
 * source (=> loaded features), i.e. features are dynamically added and
 * removed based on the current view extent.
 *
 * Style and features updates (from store) and selections are automatically
 * applied to loaded features.
 *
 * Features are augmented to efficiently derive style from different inputs:
 * View resolution, styles (global, layer, feature), selection and feature
 * properties including geometry.
 */
export const featureSource = services => {
  const { store, selection } = services

  // Feature-Id ~> Id
  // Number[4] ~> Extent

  // $styles :: Signal {k: v}
  const $styles = Signal.deferred(store.dictionary('style+'))

  // $extent :: Signal Extent
  const $extent = Signal.of(undefined, { equals: isEqual })
  const $resolution = Signal.of()

  // Called from vector source.
  // Update extent and resolution.
  const callback = (extent, resolution) => {
    $extent(extent)
    $resolution(resolution)
  }

  // $readFeature :: Signal s (JSON -> ol/Feature)
  // Convert JSON to ol/Feature with current resolution and style information.
  const $readFeature =
    Signal
      .link(R.unapply(R.identity), [$styles, $resolution])
      .map(([styles, resolution]) => ({ styles, resolution }))
      .map(readFeature) // partially applied

  // Take commands for updating spatial index.
  const $indexUpdater = Signal.of({ type: 'noop' })

  // $initialIndex :: Signal RBush
  const $initialIndex = Signal.deferred(loadRBush(store))

  // $currentIndex :: Signal RBush
  // Apply insert/remove commands to current rbush.
  const $currentIndex = Signal.options(
    Signal.lift(updateRBush, $initialIndex, $indexUpdater),
    { equals: R.F }
  )

  // $search :: Signal (Extent -> [Id])
  const $search = $currentIndex.map(searchRBush)

  // $featuresInExtent :: Signal [Id]
  const $featuresInExtent = $extent.ap($search)
  const source = vectorSource(callback)

  const getFeaturesById = ids => ids
    .map(source.getFeatureById.bind(source))
    .filter(Boolean)

  // $sourceAdditions :: Signal [ol/Feature]
  const $sourceAdditions = R.compose(
    R.map(tuples => tuples.map(([id, value]) => ({ id, ...value }))),
    Signal.await,
    R.map(ids => store.tuples(ids)),
    R.map(ids => ids.filter(id => !source.getFeatureById(id)))
  )($featuresInExtent).ap($readFeature)

  // $sourceRemovals :: Signal [ol/Feature]
  const $sourceRemovals = $featuresInExtent.map(ids => {
    const loaded = source.getFeatures().map(x => x.getId())
    return R.difference(loaded, ids).map(id => source.getFeatureById(id))
  })

  // Update source to reflect features in current extent.
  $sourceAdditions.on(features => source.addFeatures(features))
  $sourceRemovals.on(features => source.removeFeatures(features))

  // ==> batch event handling

  const $events = operations(Signal.fromListeners(['batch'], store))
  const [$globalStyle, $layerStyle, $featureStyle, $feature] = selectEvent($events)
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
    if (type === 'del') delete $styles()[key]

    // Apply (empty) style to affected features:
    source.getFeatures()
      .filter(feature => ID.layerId(feature.getId()) === layerId)
      .forEach(feature => feature.$.layerStyle(type === 'put' ? value : {}))
  })

  $featureStyle.on(({ type, key, value }) => {
    const featureId = ID.featureId(key)
    const feature = source.getFeatureById(featureId)
    if (type === 'del') delete $styles()[key]

    // Apply (empty) style to feature (if loaded):
    if (feature) feature.$.featureStyle(type === 'put' ? value : {})
  })

  $removeFeature.on(({ key }) => {
    const feature = source.getFeatureById(key)
    const item = [...feature.getGeometry().getExtent(), feature.getId()]
    $indexUpdater({ type: 'remove', item, equals: (a, b) => a[4] === b[4] })
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
    const readFeature = $readFeature()
    const feature = readFeature({ id: key, ...value })
    const item = [...feature.getGeometry().getExtent(), feature.getId()]
    $indexUpdater({ type: 'insert', item })
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
