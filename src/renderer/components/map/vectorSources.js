import * as Sources from '../../model/Sources'

export default services => {
  const { store, emitter, viewMemento, selection } = services
  const featureSource = Sources.featureSource(store)
  const markerSource = Sources.markerSource(store)
  const { visibleSource } = Sources.visibilityTracker(featureSource, store, emitter)
  const { unlockedSource } = Sources.lockedTracker(featureSource, store)
  const selectableSource = Sources.union(visibleSource, markerSource)
  const { selectedSource, deselectedSource } = Sources.selectionTracker(selectableSource, selection)
  const highlightSource = Sources.highlightTracker(emitter, store, viewMemento)
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
