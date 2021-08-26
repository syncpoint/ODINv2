import * as R from 'ramda'
import { layerId } from '../ids'
import * as MILSTD from '../symbology/2525c'

export const options = {}

const identityTag = R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])



/**
 * feature:
 */
options.feature = async (feature, cache) => {
  const descriptor = MILSTD.descriptor(feature.properties.sidc)
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []
  const identity = identityTag(MILSTD.identityCode(feature.properties.sidc))

  const tags = feature => {
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
  const { properties, name } = feature
  const { sidc } = properties
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : ['N/A']
  const description = layer.name.toUpperCase() + ' ⏤ ' + hierarchy.join(' • ')

  return {
    id: feature.id,
    title: name, // might be undefined
    description,
    url: MILSTD.url(sidc),
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


/**
 * link:
 */
options.link = async (link, cache) => {
  const container = await cache(link.ref)
  const containerName = container.name

  return {
    id: link.id,
    title: link.name + ' ⏤ ' + containerName,
    tags: [
      'SCOPE:LINK:NONE',
      ...(link.tags || []).map(label => `USER:${label}:NONE`)
    ].join(' '),
    capabilities: 'TAG',
    actions: 'PRIMARY:panto'
  }
}
