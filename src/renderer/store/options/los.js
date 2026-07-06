import * as R from 'ramda'
import { length } from '../../ol/interaction/measure/tools'
import * as ID from '../../ids'
import LineString from 'ol/geom/LineString'

/**
 * Options handler for Line-of-Sight entities (sidebar/search display).
 * @this {Object} Context with store property
 */
export default async function (id) {
  const keys = [R.identity, ID.hiddenId, ID.lockedId, ID.tagsId]
  const [los, hidden, locked, tags] = await this.store.collect(id, keys)

  const coordinates = los?.geometry?.type === 'LineString' && los.geometry.coordinates
  const description = coordinates && coordinates.length >= 2
    ? `Distance ${length(new LineString(coordinates))}`
    : undefined

  return {
    id,
    title: los?.name || 'Line of Sight',
    description,
    tags: [
      'SCOPE:LOS:NONE',
      hidden ? 'SYSTEM:HIDDEN::mdiEyeOff' : 'SYSTEM:VISIBLE::mdiEyeOutline',
      locked ? 'SYSTEM:LOCKED::mdiLock' : 'SYSTEM:UNLOCKED::mdiLockOpenVariantOutline',
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'TAG|RENAME'
  }
}
