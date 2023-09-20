import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.hiddenId, ID.lockedId, ID.tagsId]
  const [marker, hidden, locked, tags] = await this.store.collect(id, keys)

  const geometries = await this.store.geometries(id)
  const description = geometries.length === 1
    ? this.coordinatesFormat.format(geometries[0].coordinates)
    : undefined

  return {
    id,
    title: marker.name,
    description,
    tags: [
      'SCOPE:MARKER',
      hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
      locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'TAG|RENAME'
  }
}
