import * as R from 'ramda'
import * as ID from '../../ids'
import * as MILSTD from '../../symbology/2525c'
import { svg } from '../../symbology/symbol'
import * as Geometry from '../geometry'

const identityTag = R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])

export default async function (id) {
  const keys = [R.identity, ID.layerId, ID.hiddenId, ID.lockedId, ID.tagsId]
  const [feature, layer, hidden, locked, tags] = await this.store.collect(id, keys)

  const properties = feature.properties || {}
  const sidc = properties.sidc
  const descriptor = MILSTD.descriptor(sidc)
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : ['N/A']
  const geometryType = Geometry.type(descriptor)
  const identity = identityTag(MILSTD.identityCode(sidc))
  const description = layer.name
    ? layer.name.toUpperCase() + ' ⏤ ' + hierarchy.join(' • ')
    : hierarchy.join(' • ')


  return {
    id,
    title: feature.name || properties.t || null, // might be undefined
    description,
    svg: svg(sidc),
    tags: [
      'SCOPE:FEATURE',
      hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
      locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
      ...dimensions.map(label => `SYSTEM:${label}:NONE`),
      ...scope.map(label => `SYSTEM:${label}:NONE`),
      ...identity.map(label => `SYSTEM:${label}:NONE`),
      `SYSTEM:${geometryType.toLowerCase()}:NONE`,
      ...(tags || []).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'RENAME|DROP|FOLLOW'
  }
}
