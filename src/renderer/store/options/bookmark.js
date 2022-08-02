import * as ID from '../../ids'

export default async function (id, cache) {
  const bookmark = cache(id)

  const tags = [
    'SCOPE:BOOKMARK:NONE',
    ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ')

  return {
    id,
    title: bookmark.name,
    tags,
    capabilities: 'TAG|RENAME'
  }
}
