import * as Sources from '../../model/Sources'

export default services => {
  const { store, emitter, viewMemento, selection } = services
  const featureSource = Sources.union(
    Sources.featureSource(store, 'feature:'),
    Sources.featureSource(store, 'marker:')
  )

  const { visibleSource } = Sources.visibilityTracker(featureSource, store, emitter)
  const { unlockedSource } = Sources.lockedTracker(featureSource, store)
  const selectableSource = visibleSource // alias: visible features are selectable
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
