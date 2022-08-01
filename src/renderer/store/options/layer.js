import * as ID from '../../ids'

export default function (id, cache) {
  const layer = cache(id)
  const hidden = cache(ID.hiddenId(id))
  const locked = cache(ID.lockedId(id))
  const defaultFlag = cache(ID.defaultId(id))

  const tags = [
    'SCOPE:LAYER',
    hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
    locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
    ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
    ...(defaultFlag ? ['USER:default:NONE'] : []),
    'PLUS'
  ].join(' ').replace('  ', ' ').trim()

  return {
    id,
    title: layer.name,
    description: layer.type === 'socket' ? layer.url : null,
    tags,
    capabilities: 'RENAME|DROP'
  }
}
