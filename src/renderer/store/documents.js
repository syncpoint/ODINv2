import * as R from 'ramda'
import { layerId, lockedId, hiddenId } from '../ids'
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
documents.feature = (feature, cache) => {
  const properties = feature.properties || {}

  const descriptor = MILSTD.descriptor(properties.sidc)
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : []
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []

  const layer = cache(layerId(feature.id))
  const layerName = (layer && layer.name) || ''
  const { t } = properties
  const name = feature.name || t || ''
  const links = feature.links || []

  const hidden = cache(hiddenId(feature.id))
  const locked = cache(lockedId(feature.id))

  const tags = ({ tags }) => [
    hidden ? 'hidden' : 'visible',
    locked ? 'locked' : 'unlocked',
    ...(links.length ? ['link'] : []),
    ...(tags || []),
    ...dimensions,
    ...scope,
    ...identity(MILSTD.identityCode(properties.sidc))
  ]

  return {
    id: feature.id,
    scope: 'feature',
    tags: tags(feature),
    text: `${name} ${hierarchy.join(' ')} ${layerName}`.trim()
  }
}


/**
 *
 */
documents.layer = (layer, cache) => {
  const { name: text, tags } = layer
  const links = layer.links || []

  const hidden = cache(hiddenId(layer.id))
  const locked = cache(lockedId(layer.id))

  return {
    id: layer.id,
    scope: 'layer',
    text,
    tags: [
      hidden ? 'hidden' : 'visible',
      locked ? 'locked' : 'unlocked',
      ...(links.length ? ['link'] : []),
      ...(tags || [])
    ]
  }
}


/**
 *
 */
const link = link => ({
  id: link.id,
  scope: 'link',
  text: link.name,
  tags: link.tags
})

documents['link+layer'] = link
documents['link+feature'] = link


/**
 *
 */
documents.symbol = symbol => {
  const tags = [
    ...symbol.dimensions,
    symbol.scope,
    ...(symbol.tags || [])
  ]

  return ({
    id: symbol.id,
    scope: 'symbol',
    text: symbol.hierarchy.join(' '),
    tags
  })
}
