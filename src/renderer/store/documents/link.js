import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId, ID.restrictedId]
  const [link, tags, restricted] = await this.store.collect(id, keys)

  return {
    id,
    scope: ID.LINK,
    text: link.name,
    tags: [
      restricted ? 'restricted' : '',
      ...(tags || [])
    ]
  }
}
