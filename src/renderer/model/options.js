import * as R from 'ramda'
import { layerId, containerId } from '../ids'
import * as MILSTD from '../symbology/2525c'
import { url } from '../symbology/symbol'


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
  const properties = feature.properties || {}
  const sidc = properties.sidc
  const descriptor = MILSTD.descriptor(sidc)
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : ['N/A']

  const identity = identityTag(MILSTD.identityCode(sidc))
  const layer = cache(layerId(feature.id))
  const description = layer.name.toUpperCase() + ' ⏤ ' + hierarchy.join(' • ')

  // FIXME: somehow null tags can/could be introduced. check!
  const userTags = (feature.tags || []).filter(R.identity)

  // Echelon's only permitted for units and stability operations.
  const preview = () => {
    const standardSIDC = sidc
      ? sidc.startsWith('S*G*U') || sidc.startsWith('O*')
        ? sidc
        : MILSTD.format(sidc, { echelon: '-' })
      : null
    return standardSIDC ? url(standardSIDC) : null
  }

  const tags = [
    'SCOPE:FEATURE',
    feature.hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
    feature.locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
    ...dimensions.map(label => `SYSTEM:${label}:NONE`),
    ...scope.map(label => `SYSTEM:${label}:NONE`),
    ...identity.map(label => `SYSTEM:${label}:NONE`),
    ...userTags.map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ')

  return {
    id: feature.id,
    title: feature.name || properties.t || null, // might be undefined
    description,
    url: preview(),
    tags,
    capabilities: 'RENAME|DROP|FOLLOW'
  }
}


/**
 * layer:
 */
options.layer = layer => {
  const tags = [
    'SCOPE:LAYER',
    layer.hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
    layer.locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
    ...(layer.tags || []).map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ').replace('  ', ' ').trim()

  return {
    id: layer.id,
    title: layer.name,
    description: layer.type === 'socket' ? layer.url : null,
    tags,
    capabilities: 'RENAME|DROP'
  }
}


/**
 * link:
 */
const link = (link, cache) => {
  const container = cache(containerId(link))

  return {
    id: link.id,
    title: link.name,
    description: container.name,
    tags: [
      'SCOPE:LINK:NONE',
      ...(link.tags || []).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' ')
  }
}

options['link+layer'] = link
options['link+feature'] = link


/**
 * symbol:
 */
options.symbol = symbol => {
  const tags = [
    'SCOPE:SYMBOL:NONE',
    ...symbol.dimensions.map(label => `SYSTEM:${label}:NONE`),
    ...symbol.scope ? [`SYSTEM:${symbol.scope}:NONE`] : [],
    ...(symbol.tags || []).map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ')

  const standardSIDC = MILSTD.format(symbol.sidc, {
    identity: 'F', // friendly
    status: 'P' // present
  })

  return {
    id: symbol.id,
    title: R.last(symbol.hierarchy),
    description: R.dropLast(1, symbol.hierarchy).join(' • '),
    url: url(standardSIDC),
    urn: `urn:symbol:${standardSIDC}`,
    scope: 'SYMBOL',
    tags,
    capabilities: 'TAG'
  }
}
