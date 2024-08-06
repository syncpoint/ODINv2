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
 *
 */
export const featureSource = services => {
  const { store, selection } = services

  const $styles = Signal.deferred(store.dictionary('style+'))
  const $extent = Signal.of(undefined, { equals: isEqual })
  const $resolution = Signal.of()

  const callback = (extent, resolution) => {
    $extent(extent)
    $resolution(resolution)
  }

  const $readFeature =
    Signal
      .link(R.unapply(R.identity), [$styles, $resolution])
      .map(([styles, resolution]) => ({ styles, resolution }))
      .map(readFeature) // partially applied

  const $indexUpdater = Signal.of({ type: 'noop' })
  const $initialIndex = Signal.deferred(loadRBush(store))

  // RBush stays the same and is only mutated.
  const $currentIndex = Signal.options(
    Signal.lift(updateRBush, $initialIndex, $indexUpdater),
    { equals: R.F }
  )

  const $search = $currentIndex.map(searchRBush)
  const $featuresInExtent = $extent.ap($search)
  const source = vectorSource(callback)

  const getFeaturesById = ids => ids
    .map(source.getFeatureById.bind(source))
    .filter(Boolean)

  // Add features in extent to source.
  R.compose(
    R.map(tuples => tuples.map(([id, value]) => ({ id, ...value }))),
    Signal.await,
    R.map(ids => store.tuples(ids)),
    R.map(ids => ids.filter(id => !source.getFeatureById(id)))
  )($featuresInExtent)
    .ap($readFeature)
    .on(async features => source.addFeatures(await features))

  // Remove features no longer in extent from source.
  $featuresInExtent.map(ids => {
    const loaded = source.getFeatures().map(x => x.getId())
    return R.difference(loaded, ids).map(id => source.getFeatureById(id))
  }).on(features => source.removeFeatures(features))

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
    if (type === 'del') delete $styles()[key]
    source.getFeatures()
      .filter(feature => ID.layerId(feature.getId()) === layerId)
      .forEach(feature => feature.$.layerStyle(type === 'put' ? value : {}))
  })

  $featureStyle.on(({ type, key, value }) => {
    const featureId = ID.featureId(key)
    const feature = source.getFeatureById(featureId)
    if (type === 'del') delete $styles()[key]
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
    const feature = $readFeature()({ id: key, ...value })
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
