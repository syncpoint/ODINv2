import * as Sources from '../../model/Sources'
import * as ID from '../../ids'

export default services => {
  const { store, featureStore, emitter, sessionStore, selection } = services
  const featureSource = Sources.union(
    Sources.featureSource(featureStore, ID.FEATURE_SCOPE),
    Sources.featureSource(featureStore, ID.MARKER_SCOPE),
    Sources.featureSource(featureStore, ID.MEASURE_SCOPE)
  )

  const { visibleSource } = Sources.visibilityTracker(featureSource, store, emitter)
  const { unlockedSource } = Sources.lockedTracker(featureSource, store)
  const selectableSource = visibleSource // alias: visible features are selectable
  const { selectedSource, deselectedSource } = Sources.selectionTracker(selectableSource, selection)
  const highlightSource = Sources.highlightTracker(emitter, store, sessionStore)
  const modifiableSource = Sources.intersect(unlockedSource, selectedSource)

  return {
    featureSource,
    highlightSource,
    selectedSource,
    deselectedSource,
    modifiableSource,
    selectableSource,
    visibleSource
  }
}
