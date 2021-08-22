import * as R from 'ramda'
import { layerId } from '../ids'

export const documents = {}

/**
 *
 */
documents.feature = async (feature, cache) => {
  const layer = await cache(layerId(feature.id))
  const { t } = feature.properties
  const links = feature.links || []
  const hierarchy = feature.hierarchy
    ? R.drop(1, feature.hierarchy)
    : []

  const tags = ({ hidden, tags }) => [
    hidden ? 'hidden' : 'visible',
    ...(links.length ? ['link'] : []),
    ...(tags || []),
    ...(feature.dimensions ? [feature.dimensions] : []),
    ...(feature.scope ? [feature.scope] : []),
    ...(feature.identity ? [feature.identity] : [])
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
