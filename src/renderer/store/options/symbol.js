import * as R from 'ramda'
import * as ID from '../../ids'
import * as MILSTD from '../../symbology/2525c'
import { svg } from '../../symbology/symbol'

export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [symbol, tags] = await this.store.collect(id, keys)

  const standardSIDC = MILSTD.format(symbol.sidc, {
    identity: 'F', // friendly
    status: 'P' // present
  })

  return {
    id,
    title: R.last(symbol.hierarchy),
    description: R.dropLast(1, symbol.hierarchy).join(' • '),
    svg: svg(standardSIDC),
    urn: `urn:symbol:${standardSIDC}`,
    scope: 'SYMBOL',
    tags: [
      'SCOPE:SYMBOL:NONE',
      ...symbol.dimensions.map(label => `SYSTEM:${label}:NONE`),
      ...symbol.scope ? [`SYSTEM:${symbol.scope}:NONE`] : [],
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'TAG'
  }
}
