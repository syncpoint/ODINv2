import * as R from 'ramda'
import * as ID from '../../ids'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [symbol, tags] = await this.store.collect(id, keys)

  return ({
    id,
    scope: 'symbol',
    text: symbol.hierarchy.join(' '),
    tags: [
      ...symbol.dimensions,
      symbol.scope,
      ...(tags || [])
    ]
  })
}
