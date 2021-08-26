import * as R from 'ramda'
import { layerId } from '../ids'
import * as MILSTD from '../symbology/2525c'

export const documents = {}

// const sidc = feature.properties.sidc
// feature.identity = MILSTD.identityText(sidc)

// const descriptor = MILSTD.descriptor(sidc)
// if (descriptor) {
//   feature.hierarchy = descriptor.hierarchy
//   feature.scope = descriptor.scope
//   feature.dimensions = descriptor.dimensions
// }

const identity = R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])

/**
 *
 */
documents.feature = async (feature, cache) => {
  const descriptor = MILSTD.descriptor(feature.properties.sidc)
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : []
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []

  const layer = await cache(layerId(feature.id))
  const { t } = feature.properties
  const links = feature.links || []

  const tags = ({ hidden, tags }) => [
    hidden ? 'hidden' : 'visible',
    ...(links.length ? ['link'] : []),
    ...(tags || []),
    ...dimensions,
    ...scope,
    ...identity(MILSTD.identityCode(feature.properties.sidc))
  ]

  return {
    id: feature.id,
    scope: 'feature',
    tags: tags(feature),
    text: `${t} ${hierarchy.join(' ')} ${layer.name}`
  }
}


/**
 *
 */
documents.layer = layer => {
  const { name: text, hidden, tags } = layer
  const links = layer.links || []

  return {
    id: layer.id,
    scope: 'layer',
    text,
    tags: [
      hidden ? 'hidden' : 'visible',
      ...(links.length ? ['link'] : []),
      ...(tags || [])
    ]
  }
}


/**
 *
 */
documents.link = link => ({
  id: link.id,
  scope: 'link',
  text: link.name,
  tags: link.tags
})
