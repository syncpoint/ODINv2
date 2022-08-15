import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [bookmark, tags] = await this.store.collect(id, keys)

  return {
    id,
    title: bookmark.name,
    tags: [
      'SCOPE:BOOKMARK:NONE',
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'TAG|RENAME'
  }
}
