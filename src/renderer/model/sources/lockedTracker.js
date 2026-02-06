import * as R from 'ramda'
import * as ID from '../../ids'
import { TouchFeaturesEvent } from './TouchFeaturesEvent'
import { filter } from './filter'

/**
 *
 */
export const lockedTracker = (source, store) => {
  const keySet = new Set()
  const locked = key => keySet.has(key)
  const unlocked = key => !keySet.has(key)

  ;(async () => {
    store.on('batch', async ({ operations }) => {
      const candidates = operations
        .filter(({ key }) => (ID.isLockedId(key) || ID.isRestrictedId(key)))
        .map(({ type, key }) => ({ type, key: ID.associatedId(key) }))


      const [additions, removals] = R.partition(({ type }) => type === 'put', candidates)
      additions.forEach(({ key }) => keySet.add(key))
      removals.forEach(({ key }) => keySet.delete(key))

      const keys = candidates.map(({ key }) => key)
      source.dispatchEvent(new TouchFeaturesEvent(keys))
    })

    const lockedKeys = await store.keys(ID.lockedId())
    const restrictedKeys = await store.keys(ID.restrictedId())
    const keys = [...lockedKeys, ...restrictedKeys]
    keys.forEach(key => keySet.add(ID.associatedId(key)))
  })()

  return {
    unlockedSource: filter(unlocked)(source),
    lockedSource: filter(locked)(source)
  }
}
