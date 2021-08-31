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
options.feature = (feature, cache) => {
  const descriptor = MILSTD.descriptor(feature.properties.sidc)
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []
  const identity = identityTag(MILSTD.identityCode(feature.properties.sidc))

  const tags = feature => {
    // FIXME: somehow null tags can/could be introduced. check!
    const tags = (feature.tags || []).filter(R.identity)
    return [
      'SCOPE:FEATURE:identify',
      ...((feature.links || []).length ? ['IMAGE:LINKS:links:mdiLink'] : []),
      feature.hidden ? 'SYSTEM:HIDDEN:show' : 'SYSTEM:VISIBLE:hide',
      ...dimensions.map(label => `SYSTEM:${label}:NONE`),
      ...scope.map(label => `SYSTEM:${label}:NONE`),
      ...identity.map(label => `SYSTEM:${label}:NONE`),
      ...tags.map(label => `USER:${label}:NONE`)
    ].join(' ')
  }

  const layer = cache(layerId(feature.id))
  const { properties, name } = feature
  const { sidc } = properties
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : ['N/A']
  const description = layer.name.toUpperCase() + ' ⏤ ' + hierarchy.join(' • ')

  return {
    id: feature.id,
    title: name || properties.t, // might be undefined
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
  const tags = () => {
    const { hidden, tags, links } = layer

    return [
      'SCOPE:LAYER:identify',
      ...((links || []).length ? ['IMAGE:LINKS:links:mdiLink'] : []),
      hidden ? 'SYSTEM:HIDDEN:show' : 'SYSTEM:VISIBLE:hide',
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
options.link = (link, cache) => {
  const container = cache(link.ref)
  const containerName = container.name

  return {
    id: link.id,
    title: link.name,
    description: containerName,
    tags: [
      'SCOPE:LINK:NONE',
      ...(link.tags || []).map(label => `USER:${label}:NONE`)
    ].join(' '),
    capabilities: 'TAG',
    actions: 'PRIMARY:panto'
  }
}