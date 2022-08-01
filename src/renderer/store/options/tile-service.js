import * as ID from '../../ids'

export default function (id, cache) {
  const service = cache(id)

  const tags = [
    `SCOPE:${service.type}:NONE`,
    ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ')

  const option = {
    id,
    title: service.name,
    scope: service.type,
    tags,
    capabilities: 'TAG|RENAME'
  }

  return option
}
