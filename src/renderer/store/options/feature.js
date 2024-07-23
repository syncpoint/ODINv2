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
  const keys = [R.identity, ID.layerId, ID.hiddenId, ID.lockedId, ID.restrictedId, ID.tagsId]
  const [feature, layer, hidden, locked, restricted, tags] = await this.store.collect(id, keys)
  const links = await this.store.keys(ID.prefix('link')(id))

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

  const geometryTag = geometryType === 'Polygon'
    ? `SYSTEM:${geometryType.toLowerCase()}`
    : `SYSTEM:${geometryType.toLowerCase()}:NONE`

  return {
    id,
    title: feature.name || properties.t || null, // might be undefined
    description,
    svg: svg(sidc),
    tags: [
      'SCOPE:FEATURE',
      hidden ? 'SYSTEM:HIDDEN::mdiEyeOff' : 'SYSTEM:VISIBLE::mdiEyeOutline',
      restricted ? 'SYSTEM:RESTRICTED:NONE:mdiShieldLockOutline' : (locked ? 'SYSTEM:LOCKED::mdiLock' : 'SYSTEM:UNLOCKED::mdiLockOpenVariantOutline'),
      ...(links.length ? ['SYSTEM:LINK::mdiLinkVariant'] : []),
      geometryTag,
      ...dimensions.map(label => `SYSTEM:${label}:NONE`),
      ...scope.map(label => `SYSTEM:${label}:NONE`),
      ...identity.map(label => `SYSTEM:${label}:NONE`),
      ...(tags || []).map(label => `USER:${label}:NONE::${!restricted ?? false}`),
      restricted ? undefined : 'PLUS'
    ].filter(Boolean).join(' '),
    capabilities: restricted ? 'FOLLOW' : 'RENAME|DROP|FOLLOW'
  }
}
