import * as ID from '../../ids'
import { featureSource } from '../../model/sources/featureSource'
import { highlightTracker } from '../../model/sources/highlightTracker'
import { lockedTracker } from '../../model/sources/lockedTracker'
import { visibilityTracker } from '../../model/sources/visibilityTracker'
import { selectionTracker } from '../../model/sources/selectionTracker'
import { intersect } from '../../model/sources/intersect'
import { union } from '../../model/sources/union'

export default async services => {
  const { store, featureStore, emitter, sessionStore, selection } = services

  // const featureSource = Sources.union(
  //   Sources.featureSource(featureStore, ID.FEATURE_SCOPE),
  //   Sources.featureSource(featureStore, ID.MARKER_SCOPE),
  //   Sources.featureSource(featureStore, ID.MEASURE_SCOPE)
  // )

  const features = featureSource(services)

  const { visibleSource } = await visibilityTracker(features, store, emitter)
  const { unlockedSource } = lockedTracker(features, store)
  const selectableSource = visibleSource // alias: visible features are selectable
  const { selectedSource, deselectedSource } = selectionTracker(selectableSource, selection)
  const highlightSource = highlightTracker(emitter, store, sessionStore)
  const modifiableSource = intersect(unlockedSource, selectedSource)

  return {
    featureSource: features,
    highlightSource,
    selectedSource,
    deselectedSource,
    modifiableSource,
    selectableSource,
    visibleSource
  }
}
