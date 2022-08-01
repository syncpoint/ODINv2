import * as R from 'ramda'
import * as ID from '../ids'

import * as MILSTD from '../symbology/2525c'

export default function DocumentStore () {
}

const identity = R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])


/**
 *
 */
DocumentStore.prototype.feature = function (id, feature, cache) {
  const properties = feature.properties || {}
  const descriptor = MILSTD.descriptor(properties.sidc)
  const hierarchy = descriptor ? R.drop(1, descriptor.hierarchy) : []
  const dimensions = descriptor ? descriptor.dimensions : []
  const scope = descriptor && descriptor.scope ? [descriptor.scope] : []

  const layer = cache(ID.layerId(id))
  const layerName = (layer && layer.name) || ''
  const { t } = properties
  const name = feature.name || t || ''
  const links = feature.links || []

  const hidden = cache(ID.hiddenId(id))
  const locked = cache(ID.lockedId(id))

  const tags = [
    hidden ? 'hidden' : 'visible',
    locked ? 'locked' : 'unlocked',
    ...(links.length ? ['link'] : []),
    ...(cache(ID.tagsId(id)) || []),
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
DocumentStore.prototype.layer = function (id, layer, cache) {
  const { name: text } = layer
  const links = layer.links || []
  const hidden = cache(ID.hiddenId(id))
  const locked = cache(ID.lockedId(id))
  const defaultFlag = cache(ID.defaultId(id))

  const tags = [
    hidden ? 'hidden' : 'visible',
    locked ? 'locked' : 'unlocked',
    ...(links.length ? ['link'] : []),
    ...(cache(ID.tagsId(id)) || []),
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
DocumentStore.prototype.link = function (id, link, cache) {
  return {
    id,
    scope: 'link',
    text: link.name,
    tags: cache(ID.tagsId(id)) || []
  }
}

DocumentStore.prototype['link+layer'] = DocumentStore.prototype.link
DocumentStore.prototype['link+feature'] = DocumentStore.prototype.link


/**
 *
 */
DocumentStore.prototype.symbol = function (id, symbol, cache) {
  const tags = [
    ...symbol.dimensions,
    symbol.scope,
    ...(cache(ID.tagsId(id)) || [])
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
DocumentStore.prototype.marker = function (id, marker, cache) {
  const name = marker.name || ''
  const tags = cache(ID.tagsId(id)) || []

  return {
    id,
    scope: 'marker',
    text: name,
    tags
  }
}

/**
 *
 */
DocumentStore.prototype.bookmark = function (id, bookmark, cache) {
  const name = bookmark.name || ''
  const tags = cache(ID.tagsId(id)) || []

  return {
    id,
    scope: 'bookmark',
    text: name,
    tags
  }
}
