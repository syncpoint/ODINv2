import * as ID from '../../ids'

export default function (id, service, cache) {
  const tags = cache(ID.tagsId(id)) || []

  const document = {
    id,
    scope: 'tile-service',
    text: service.name,
    tags: [...tags, service.type]
  }

  return document
}
