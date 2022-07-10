import * as R from 'ramda'
import { layerId, containerId, lockedId, hiddenId, tagsId, defaultId } from '../ids'
import * as MILSTD from '../symbology/2525c'
import { url } from '../symbology/symbol'


const identityTag = R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])


/**
 * feature:
 */
const feature = (/* services */) => (id, cache) => {
  const feature = cache(id)

  const properties = feature.properties || {}
  const sidc = properties.sidc
  const descriptor = MILSTD.descriptor(sidc)
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : ['N/A']

  const identity = identityTag(MILSTD.identityCode(sidc))
  const layer = cache(layerId(id))
  const description = layer.name
    ? layer.name.toUpperCase() + ' ⏤ ' + hierarchy.join(' • ')
    : hierarchy.join(' • ')

  // FIXME: somehow null tags can/could be introduced. check!
  const userTags = (cache(tagsId(id)) || []).filter(R.identity)

  // Echelon's only permitted for units and stability operations.
  const preview = () => {
    const standardSIDC = sidc
      ? sidc.startsWith('S*G*U') || sidc.startsWith('O*')
        ? sidc
        : MILSTD.format(sidc, { echelon: '-' })
      : null
    return standardSIDC ? url(standardSIDC) : null
  }

  const hidden = cache(hiddenId(id))
  const locked = cache(lockedId(id))

  const tags = [
    'SCOPE:FEATURE',
    hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
    locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
    ...dimensions.map(label => `SYSTEM:${label}:NONE`),
    ...scope.map(label => `SYSTEM:${label}:NONE`),
    ...identity.map(label => `SYSTEM:${label}:NONE`),
    ...userTags.map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ')

  return {
    id,
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
const layer = (/* services */) => (id, cache) => {
  const layer = cache(id)
  const hidden = cache(hiddenId(id))
  const locked = cache(lockedId(id))
  const defaultFlag = cache(defaultId(id))

  const tags = [
    'SCOPE:LAYER',
    hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
    locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
    ...((cache(tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
    ...(defaultFlag ? ['USER:default:NONE'] : []),
    'PLUS'
  ].join(' ').replace('  ', ' ').trim()

  return {
    id,
    title: layer.name,
    description: layer.type === 'socket' ? layer.url : null,
    tags,
    capabilities: 'RENAME|DROP'
  }
}


/**
 * link:
 */
const link = (/* services */) => (id, cache) => {
  const link = cache(id)
  const container = cache(containerId(id))

  return {
    id,
    title: link.name,
    description: container.name,
    tags: [
      'SCOPE:LINK:NONE',
      ...((cache(tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' ')
  }
}

/**
 * symbol:
 */
const symbol = (/* services */) => (id, cache) => {
  const symbol = cache(id)

  const tags = [
    'SCOPE:SYMBOL:NONE',
    ...symbol.dimensions.map(label => `SYSTEM:${label}:NONE`),
    ...symbol.scope ? [`SYSTEM:${symbol.scope}:NONE`] : [],
    ...((cache(tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ')

  const standardSIDC = MILSTD.format(symbol.sidc, {
    identity: 'F', // friendly
    status: 'P' // present
  })

  return {
    id,
    title: R.last(symbol.hierarchy),
    description: R.dropLast(1, symbol.hierarchy).join(' • '),
    url: url(standardSIDC),
    urn: `urn:symbol:${standardSIDC}`,
    scope: 'SYMBOL',
    tags,
    capabilities: 'TAG'
  }
}

/**
 * marker:
 */
const marker = services => {
  const { coordinatesFormat, featureStore } = services

  return async (id, cache) => {
    const marker = cache(id)

    const geometries = await featureStore.geometries(id)
    const description = geometries.length === 1
      ? coordinatesFormat.format(geometries[0].coordinates)
      : undefined

    const tags = [
      'SCOPE:MARKER:NONE',
      ...((cache(tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' ')

    return {
      id,
      title: marker.name,
      description,
      scope: 'MARKER',
      tags,
      capabilities: 'TAG|RENAME'
    }
  }
}

export const options = services => ({
  feature: feature(services),
  layer: layer(services),
  'link+layer': link(services),
  'link+feature': link(services),
  symbol: symbol(services),
  marker: marker(services)
})
