import * as R from 'ramda'
import * as ID from '../../ids'
import { TouchFeaturesEvent } from './TouchFeaturesEvent'
import { filter } from './filter'

/**
 *
 */
export const visibilityTracker = async (source, store, emitter) => {
  const keySet = new Set()

  // A feature is hidden when it is hidden itself or when its layer is.
  // Hiding a layer marks the features present at that moment, but features
  // arriving later (NIDO WebSocket, Matrix replication) carry no marker of
  // their own; they still must not show up in a hidden layer.
  const hidden = key => keySet.has(key) ||
    (ID.isFeatureId(key) && keySet.has(ID.layerId(key)))
  const visible = key => !hidden(key)

  await (async () => {
    emitter.on('feature/show', ({ ids }) => {
      const keys = ids.map(ID.associatedId)
      keys.forEach(key => keySet.delete(key))
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    emitter.on('feature/hide', ({ ids }) => {
      const keys = ids.map(ID.associatedId)
      keys.forEach(key => keySet.add(key))
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    store.on('batch', ({ operations }) => {
      const candidates = operations
        .filter(({ key }) => ID.isHiddenId(key))
        .map(({ type, key }) => ({ type, key: ID.associatedId(key) }))

      const [additions, removals] = R.partition(({ type }) => type === 'put', candidates)
      additions.forEach(({ key }) => keySet.add(key))
      removals.forEach(({ key }) => keySet.delete(key))
      const keys = candidates.map(({ key }) => key)
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    const keys = await store.keys(ID.hiddenId())
    keys.forEach(key => keySet.add(ID.associatedId(key)))
  })()

  return {
    visibleSource: filter(visible)(source),
    hiddenSource: filter(hidden)(source)
  }
}
