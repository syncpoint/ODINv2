import * as ID from '../../ids'

export default function (id, bookmark, cache) {
  const name = bookmark.name || ''
  const tags = cache(ID.tagsId(id)) || []

  return {
    id,
    scope: 'bookmark',
    text: name,
    tags
  }
}
