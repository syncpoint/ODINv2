import * as R from 'ramda'
import * as ID from '../../ids'

/**
 * Options handler for Area-of-Sight entities (sidebar/search display).
 * @this {Object} Context with store property
 */
export default async function (id) {
  const keys = [R.identity, ID.hiddenId, ID.lockedId, ID.tagsId]
  const [aos, hidden, locked, tags] = await this.store.collect(id, keys)

  const radius = aos?.properties?.radius
  const description = typeof radius === 'number'
    ? `Radius ${radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}`
    : undefined

  return {
    id,
    title: aos?.name || 'Area of Sight',
    description,
    tags: [
      'SCOPE:AOS:NONE',
      hidden ? 'SYSTEM:HIDDEN::mdiEyeOff' : 'SYSTEM:VISIBLE::mdiEyeOutline',
      locked ? 'SYSTEM:LOCKED::mdiLock' : 'SYSTEM:UNLOCKED::mdiLockOpenVariantOutline',
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'TAG|RENAME'
  }
}
