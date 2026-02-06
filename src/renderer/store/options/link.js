import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId, ID.containerId]
  const [link, tags, container] = await this.store.collect(id, keys)

  /* if the container - either a layer or a link - ist restricted, the child element is restricted as well */
  const containerId = ID.containerId(id)
  const [restricted] = await this.store.collect(containerId, [ID.restrictedId])

  return {
    id,
    title: link.name,
    description: container.name,
    capabilities: restricted ? '' : 'RENAME|TAG',
    tags: [
      'SCOPE:LINK:NONE',
      ...((tags || [])).map(label => `USER:${label}:NONE::${restricted}`),
      restricted ? undefined : 'PLUS'
    ].filter(Boolean).join(' ')
  }
}
