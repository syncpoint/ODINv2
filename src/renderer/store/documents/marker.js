import * as ID from '../../ids'

export default function (id, marker, cache) {
  const name = marker.name || ''
  const tags = cache(ID.tagsId(id)) || []

  return {
    id,
    scope: 'marker',
    text: name,
    tags
  }
}
