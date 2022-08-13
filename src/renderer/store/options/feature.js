import * as R from 'ramda'
import * as ID from '../../ids'
import * as MILSTD from '../../symbology/2525c'
import { svg } from '../../symbology/symbol'

const identityTag = R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])

export default function (id, cache) {
  const feature = cache(id)

  const properties = feature.properties || {}
  const sidc = properties.sidc
  const descriptor = MILSTD.descriptor(sidc)
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : ['N/A']

  const identity = identityTag(MILSTD.identityCode(sidc))
  const layer = cache(ID.layerId(id))
  const description = layer.name
    ? layer.name.toUpperCase() + ' ⏤ ' + hierarchy.join(' • ')
    : hierarchy.join(' • ')

  const userTags = (cache(ID.tagsId(id)) || []).filter(R.identity)

  const hidden = cache(ID.hiddenId(id))
  const locked = cache(ID.lockedId(id))

  const tags = [
    'SCOPE:FEATURE',
    hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
    locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
    ...dimensions.map(label => `SYSTEM:${label}:NONE`),
    ...scope.map(label => `SYSTEM:${label}:NONE`),
    ...identity.map(label => `SYSTEM:${label}:NONE`),
    ...userTags.map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ')

  return {
    id,
    title: feature.name || properties.t || null, // might be undefined
    description,
    svg: svg(sidc),
    tags,
    capabilities: 'RENAME|DROP|FOLLOW'
  }
}
