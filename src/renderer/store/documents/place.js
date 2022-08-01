import * as R from 'ramda'
import * as ID from '../../ids'

export default function (id, place, cache) {
  const tags = [
    ...place.tags,
    ...(cache(ID.tagsId(id)) || [])
  ].filter(R.identity)

  return {
    id,
    scope: 'place',
    text: place.display_name,
    tags
  }
}
