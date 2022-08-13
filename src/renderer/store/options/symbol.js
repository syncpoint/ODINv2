import * as R from 'ramda'
import * as ID from '../../ids'
import * as MILSTD from '../../symbology/2525c'
import { svg } from '../../symbology/symbol'

export default function (id, cache) {
  const symbol = cache(id)

  const tags = [
    'SCOPE:SYMBOL:NONE',
    ...symbol.dimensions.map(label => `SYSTEM:${label}:NONE`),
    ...symbol.scope ? [`SYSTEM:${symbol.scope}:NONE`] : [],
    ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ')

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
    tags,
    capabilities: 'TAG'
  }
}
