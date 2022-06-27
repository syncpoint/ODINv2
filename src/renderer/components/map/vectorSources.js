import * as Sources from '../../model/Sources'

export default services => {
  const { featureStore, emitter, viewMemento, selection } = services
  const featureSource = Sources.featureSource(featureStore)
  const markerSource = Sources.markerSource(featureStore)
  const { visibleSource } = Sources.visibilityTracker(featureSource, featureStore, emitter)
  const { unlockedSource } = Sources.lockedTracker(featureSource, featureStore)
  const selectableSource = Sources.union(visibleSource, markerSource)
  const { selectedSource, deselectedSource } = Sources.selectionTracker(selectableSource, selection)
  const highlightSource = Sources.highlightTracker(emitter, featureStore, viewMemento)
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
