import * as R from 'ramda'
import * as ID from '../ids'
import * as MILSTD from '../symbology/2525c'
import { url } from '../symbology/symbol'

const identityTag = R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])

export default function OptionStore (coordinatesFormat, store) {
  this.coordinatesFormat = coordinatesFormat
  this.store = store
}


/**
 *
 */
OptionStore.prototype.feature = function (id, cache) {
  const feature = cache(id)

  const properties = feature.properties || {}
  const sidc = properties.sidc
  const descriptor = MILSTD.descriptor(sidc)
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : ['N/A']

  const identity = identityTag(MILSTD.identityCode(sidc))
  const layer = cache(ID.layerId(id))
  const description = layer.name
    ? layer.name.toUpperCase() + ' ⏤ ' + hierarchy.join(' • ')
    : hierarchy.join(' • ')

  const userTags = (cache(ID.tagsId(id)) || []).filter(R.identity)

  // Echelon's only permitted for units and stability operations.
  const preview = () => {
    const standardSIDC = sidc
      ? sidc.startsWith('S*G*U') || sidc.startsWith('O*')
        ? sidc
        : MILSTD.format(sidc, { echelon: '-' })
      : null
    return standardSIDC ? url(standardSIDC) : null
  }

  const hidden = cache(ID.hiddenId(id))
  const locked = cache(ID.lockedId(id))

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
 *
 */
OptionStore.prototype.layer = function (id, cache) {
  const layer = cache(id)
  const hidden = cache(ID.hiddenId(id))
  const locked = cache(ID.lockedId(id))
  const defaultFlag = cache(ID.defaultId(id))

  const tags = [
    'SCOPE:LAYER',
    hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
    locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
    ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
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
OptionStore.prototype.link = function (id, cache) {
  const link = cache(id)
  const container = cache(ID.containerId(id))

  return {
    id,
    title: link.name,
    description: container.name,
    tags: [
      'SCOPE:LINK:NONE',
      ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' ')
  }
}

OptionStore.prototype['link+layer'] = OptionStore.prototype.link
OptionStore.prototype['link+feature'] = OptionStore.prototype.link


/**
 *
 */
OptionStore.prototype.symbol = function (id, cache) {
  const symbol = cache(id)

  const tags = [
    'SCOPE:SYMBOL:NONE',
    ...symbol.dimensions.map(label => `SYSTEM:${label}:NONE`),
    ...symbol.scope ? [`SYSTEM:${symbol.scope}:NONE`] : [],
    ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
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
OptionStore.prototype.marker = async function (id, cache) {
  const marker = cache(id)
  const geometries = await this.store.geometries(id)
  const description = geometries.length === 1
    ? this.coordinatesFormat.format(geometries[0].coordinates)
    : undefined

  const hidden = cache(ID.hiddenId(id))
  const locked = cache(ID.lockedId(id))

  const tags = [
    'SCOPE:MARKER:NONE',
    hidden ? 'SYSTEM:HIDDEN' : 'SYSTEM:VISIBLE',
    locked ? 'SYSTEM:LOCKED' : 'SYSTEM:UNLOCKED',
    ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
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

/**
 * bookmark:
 */
OptionStore.prototype.bookmark = async function (id, cache) {
  const bookmark = cache(id)

  const tags = [
    'SCOPE:BOOKMARK:NONE',
    ...((cache(ID.tagsId(id)) || [])).map(label => `USER:${label}:NONE`),
    'PLUS'
  ].join(' ')

  return {
    id,
    title: bookmark.name,
    scope: 'BOOKMARK',
    tags,
    capabilities: 'TAG|RENAME'
  }
}
