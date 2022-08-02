import * as R from 'ramda'
import * as ID from '../../ids'

export default function (id, cache) {
  const place = cache(id)

  const tags = place.tags
    .filter(s => s !== 'place')
    .filter(R.identity)
    .map(label => `SYSTEM:${label}:NONE`)

  return {
    id,
    title: place.name,
    description: place.description,
    tags: [
      'SCOPE:PLACE:NONE',
      ...tags,
      ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'TAG|RENAME'
  }
}
