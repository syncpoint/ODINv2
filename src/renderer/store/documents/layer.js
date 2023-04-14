import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.hiddenId, ID.lockedId, ID.tagsId, ID.defaultId, ID.sharedId]
  const [layer, hidden, locked, tags, defaultFlag, shared] = await this.store.collect(id, keys)
  if (!layer) return

  const links = await this.store.keys(ID.prefix('link')(id))

  return {
    id,
    scope: ID.LAYER,
    text: layer.name,
    tags: [
      hidden ? 'hidden' : 'visible',
      locked ? 'locked' : 'unlocked',
      shared ? 'shared' : undefined,
      ...(links.length ? ['link'] : []),
      ...(tags || []),
      ...(defaultFlag ? ['default'] : [])
    ]
  }
}
