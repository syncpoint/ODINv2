import * as ID from '../../ids'

export default function (id, link, cache) {
  return {
    id,
    scope: 'link',
    text: link.name,
    tags: cache(ID.tagsId(id)) || []
  }
}
