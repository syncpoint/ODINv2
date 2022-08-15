import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId, ID.containerId]
  const [link, tags, container] = await this.store.collect(id, keys)

  return {
    id,
    title: link.name,
    description: container.name,
    tags: [
      'SCOPE:LINK:NONE',
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' ')
  }
}
