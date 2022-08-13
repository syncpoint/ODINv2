import * as R from 'ramda'
import * as ID from '../../ids'
import * as MILSTD from '../../symbology/2525c'
import * as Geometry from '../geometry'

const identity = R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])


/**
 *
 */
export default function (id, feature, cache) {
  const properties = feature.properties || {}

  const descriptor = MILSTD.descriptor(properties.sidc)
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : []
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []

  const layer = cache(ID.layerId(id))
  const layerName = (layer && layer.name) || ''
  const { t } = properties
  const name = feature.name || t || ''
  const links = feature.links || []

  const hidden = cache(ID.hiddenId(id))
  const locked = cache(ID.lockedId(id))
  const geometryType = Geometry.type(descriptor)

  const tags = [
    hidden ? 'hidden' : 'visible',
    locked ? 'locked' : 'unlocked',
    geometryType.toLowerCase(),
    ...(links.length ? ['link'] : []),
    ...(cache(ID.tagsId(id)) || []),
    ...dimensions,
    ...scope,
    ...identity(MILSTD.identityCode(properties.sidc))
  ]

  return {
    id,
    scope: 'feature',
    tags,
    text: `${name} ${hierarchy.join(' ')} ${layerName}`.trim()
  }
}
