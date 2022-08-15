import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [bookmark, tags] = await this.store.collect(id, keys)

  return {
    id,
    scope: 'bookmark',
    text: bookmark.name || '',
    tags: tags || []
  }
}
