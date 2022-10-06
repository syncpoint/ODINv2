import * as Sources from '../../model/Sources'

export default services => {
  const { store, featureStore, emitter, sessionStore, selection } = services
  const featureSource = Sources.union(
    Sources.featureSource(store, featureStore, 'feature:'),
    Sources.featureSource(store, featureStore, 'marker:'),
    Sources.featureSource(store, featureStore, 'measurement:')
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
