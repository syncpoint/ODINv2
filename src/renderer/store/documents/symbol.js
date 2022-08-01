import * as ID from '../../ids'

export default function (id, symbol, cache) {
  const tags = [
    ...symbol.dimensions,
    symbol.scope,
    ...(cache(ID.tagsId(id)) || [])
  ]

  return ({
    id,
    scope: 'symbol',
    text: symbol.hierarchy.join(' '),
    tags
  })
}
