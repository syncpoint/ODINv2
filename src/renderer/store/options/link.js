import * as ID from '../../ids'

export default function (id, cache) {
  const link = cache(id)
  const container = cache(ID.containerId(id))

  return {
    id,
    title: link.name,
    description: container.name,
    tags: [
      'SCOPE:LINK:NONE',
      ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' ')
  }
}
