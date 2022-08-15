import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.hiddenId, ID.lockedId, ID.tagsId, ID.defaultId]
  const [layer, hidden, locked, tags, defaultFlag] = await this.store.collect(id, keys)

  return {
    id,
    title: layer.name,
    description: layer.type === 'socket' ? layer.url : null,
    tags: [
      'SCOPE:LAYER',
      hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
      locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      ...(defaultFlag ? ['USER:default:NONE'] : []),
      'PLUS'
    ].join(' ').replace('  ', ' ').trim(),
    highlight: defaultFlag,
    capabilities: 'RENAME|DROP'
  }
}
