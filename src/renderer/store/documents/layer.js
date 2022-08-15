import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.hiddenId, ID.lockedId, ID.tagsId, ID.defaultId]
  const [layer, hidden, locked, tags, defaultFlag] = await this.store.collect(id, keys)

  // TODO: resolve links

  return {
    id,
    scope: 'layer',
    text: layer.name,
    tags: [
      hidden ? 'hidden' : 'visible',
      locked ? 'locked' : 'unlocked',
      ...(tags || []),
      ...(defaultFlag ? ['default'] : [])
    ]
  }
}
