import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [service, tags] = await this.store.collect(id, keys)

  const option = {
    id,
    title: service.name,
    scope: ID.SSE_SERVICE,
    tags: [
      `SCOPE:${ID.SSE_SERVICE}:NONE`,
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'TAG|RENAME'
  }

  return option
}
