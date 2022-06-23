import * as R from 'ramda'
import { layerId, lockedId, hiddenId, tagsId, defaultId } from '../ids'
import * as MILSTD from '../symbology/2525c'

export const documents = {}

const identity = R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])


/**
 *
 */
documents.feature = (id, feature, cache) => {
  const properties = feature.properties || {}

  const descriptor = MILSTD.descriptor(properties.sidc)
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : []
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []

  const layer = cache(layerId(id))
  const layerName = (layer && layer.name) || ''
  const { t } = properties
  const name = feature.name || t || ''
  const links = feature.links || []

  const hidden = cache(hiddenId(id))
  const locked = cache(lockedId(id))

  const tags = [
    hidden ? 'hidden' : 'visible',
    locked ? 'locked' : 'unlocked',
    ...(links.length ? ['link'] : []),
    ...(cache(tagsId(id)) || []),
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


/**
 *
 */
documents.layer = (id, layer, cache) => {
  const { name: text } = layer
  const links = layer.links || []
  const hidden = cache(hiddenId(id))
  const locked = cache(lockedId(id))
  const defaultFlag = cache(defaultId(id))

  const tags = [
    hidden ? 'hidden' : 'visible',
    locked ? 'locked' : 'unlocked',
    ...(links.length ? ['link'] : []),
    ...(cache(tagsId(id)) || []),
    ...(defaultFlag ? ['default'] : [])
  ]

  return {
    id,
    scope: 'layer',
    text,
    tags
  }
}


/**
 *
 */
const link = (id, link, cache) => ({
  id,
  scope: 'link',
  text: link.name,
  tags: cache(tagsId(id)) || []
})

documents['link+layer'] = link
documents['link+feature'] = link


/**
 *
 */
documents.symbol = (id, symbol, cache) => {
  const tags = [
    ...symbol.dimensions,
    symbol.scope,
    ...(cache(tagsId(id)) || [])
  ]

  return ({
    id,
    scope: 'symbol',
    text: symbol.hierarchy.join(' '),
    tags
  })
}

/**
 *
 */
documents.marker = (id, marker, cache) => {
  const name = marker.name || ''
  const tags = cache(tagsId(id)) || []

  return {
    id,
    scope: 'marker',
    text: name,
    tags
  }
}
