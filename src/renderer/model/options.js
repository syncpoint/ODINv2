import { layerId } from '../ids'

export const options = {}


/**
 * feature:
 */
options.feature = async (feature, cache) => {
  const tags = feature => {
    const dimensions = feature.dimensions || []
    const scope = feature.scope ? [feature.scope] : []
    const identity = feature.identity || []

    return [
      'SCOPE:FEATURE:identify',
      ...((feature.links || []).length ? ['IMAGE:LINKS:links:mdiLink'] : []),
      feature.hidden ? 'SYSTEM:HIDDEN:show' : 'SYSTEM:VISIBLE:hide',
      ...dimensions.map(label => `SYSTEM:${label}:NONE`),
      ...scope.map(label => `SYSTEM:${label}:NONE`),
      ...identity.map(label => `SYSTEM:${label}:NONE`),
      ...(feature.tags || []).map(label => `USER:${label}:NONE`)
    ].join(' ')
  }

  const layer = await cache(layerId(feature.id))
  const { properties } = feature
  const { sidc, t } = properties
  const hierarchy = feature.hierarchy || ['N/A']
  const description = layer.name.toUpperCase() + ' ⏤ ' + hierarchy.join(' • ')

  return {
    id: feature.id,
    title: t || 'N/A',
    description,
    // TODO: url
    tags: tags(feature, sidc),
    capabilities: 'RENAME|TAG|DROP|FOLLOW',
    actions: 'PRIMARY:panto'
  }
}


/**
 * layer:
 */
options.layer = layer => {
  const tags = feature => {
    const { type, hidden, active, tags, links } = feature

    const socket = type === 'socket'
      ? active
        ? ['SYSTEM:ACTIVE:suspend']
        : ['SYSTEM:INACTIVE:resume']
      : []

    return [
      'SCOPE:LAYER:identify',
      ...((links || []).length ? ['IMAGE:LINKS:links:mdiLink'] : []),
      'IMAGE:OPEN:open:mdiArrowDown',
      hidden ? 'SYSTEM:HIDDEN:show' : 'SYSTEM:VISIBLE:hide',
      ...[socket],
      ...(tags || []).map(label => `USER:${label}:NONE`)
    ].join(' ').replace('  ', ' ').trim()
  }

  return {
    id: layer.id,
    title: layer.name,
    description: layer.type === 'socket' ? layer.url : null,
    tags: tags(layer),
    capabilities: 'RENAME|TAG|DROP',
    actions: 'PRIMARY:panto'
  }
}
