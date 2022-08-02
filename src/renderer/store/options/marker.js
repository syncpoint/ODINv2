import * as ID from '../../ids'

export default async function (id, cache) {
  const marker = cache(id)
  const geometries = await this.store.geometries(id)
  const description = geometries.length === 1
    ? this.coordinatesFormat.format(geometries[0].coordinates)
    : undefined

  const hidden = cache(ID.hiddenId(id))
  const locked = cache(ID.lockedId(id))

  const tags = [
    'SCOPE:MARKER:NONE',
    hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
    locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
    ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ')

  return {
    id,
    title: marker.name,
    description,
    tags,
    capabilities: 'TAG|RENAME'
  }
}
