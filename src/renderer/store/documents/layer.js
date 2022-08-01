import * as ID from '../../ids'

export default function (id, layer, cache) {
  const { name: text } = layer
  const links = layer.links || []
  const hidden = cache(ID.hiddenId(id))
  const locked = cache(ID.lockedId(id))
  const defaultFlag = cache(ID.defaultId(id))

  const tags = [
    hidden ? 'hidden' : 'visible',
    locked ? 'locked' : 'unlocked',
    ...(links.length ? ['link'] : []),
    ...(cache(ID.tagsId(id)) || []),
    ...(defaultFlag ? ['default'] : [])
  ]

  return {
    id,
    scope: 'layer',
    text,
    tags
  }
}
