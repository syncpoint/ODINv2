import * as R from 'ramda'
import uuid from 'uuid-random'

export const layerId = R.cond([
  [R.isNil, () => `layer:${uuid()}`],
  // must be a string then...
  [R.startsWith('feature:'), x => `layer:${x.split(':')[1].split('/')[0]}`],
  [R.startsWith('layer:'), R.identity],
  [R.includes('+layer:'), x => x.split('+')[1]],
  [R.T, x => layerId(x.id)]
])

export const layerUUID = R.cond([
  [R.startsWith('feature:'), x => x.split(':')[1].split('/')[0]],
  [R.startsWith('layer:'), x => x.split(':')[1]],
  [R.T, () => uuid()]
])

export const featureId = R.cond([
  [x => typeof x === 'object', R.prop('id')],
  [R.includes('+feature:'), x => x.split('+')[1]],
  [R.T, layerId => `feature:${layerId.split(':')[1]}/${uuid()}`]
])

export const markerId = R.cond([
  [R.isNil, () => `marker:${uuid()}`]
])

export const bookmarkId = R.cond([
  [R.isNil, () => `bookmark:${uuid()}`]
])

export const linkId = id => `link+${id}/${uuid()}`

export const tileServiceId = R.cond([
  [R.isNil, () => `tile-service:${uuid()}`],
  [R.startsWith('tile-layer:'), x => `tile-service:${x.split(':')[1].split('/')[0]}`]
])

/**
 * layer:{uuid} -> link+layer:{uuid}
 * feature:{uuid}/(uuid) -> link+feature:{uuid}/uuid
 */
export const prefix = prefix => id => `${prefix}+${id || ''}`
export const lockedId = prefix('locked')
export const hiddenId = prefix('hidden')
export const stickyId = prefix('sticky')
export const sharedId = prefix('shared')
export const defaultId = prefix('default')
export const tagsId = prefix('tags')
export const tileLayerId = prefix('tile-layer')

/** Only a single preset (for now.) */
export const defaultTileServiceId = 'tile-service:00000000-0000-0000-0000-000000000000'
export const defaultTileLayerId = 'tile-layer:00000000-0000-0000-0000-000000000000'
export const defaultTilePresetId = 'tile-preset:00000000-0000-0000-0000-000000000000'
export const tilePresetId = () => defaultTilePresetId

/**
 * '+'-notation container id.
 *
 * link+layer:{uuid}/{uuid} => layer:{uuid}
 * link+feature:{uuid}/{uuid}/{uuid} => feature:{uuid}/{uuid}
 */
export const containerId = id => {
  const indexStart = id.indexOf('+') // remove '...+' part
  const indexEnd = id.lastIndexOf('/') // remove last UUID
  return id.substring(indexStart + 1, indexEnd)
}

/**
 * '+'-notation associated id.
 *
 * tags+layer:{uuid} => layer:{uuid}
 * locked+feature:{uuid}/{uuid} => feature:{uuid}/{uuid}
 * tags+link+feature:{uuid}/{uuid}/{uuid} => link+feature:{uuid}/{uuid}/{uuid}
 * feature:{uuid}/{uuid} => feature:{uuid}/{uuid} [identity]
 */
export const associatedId = id => {
  const indexStart = id.indexOf('+') // remove '...+' part
  return indexStart === -1
    ? id /* identity */
    : id.substring(indexStart + 1)
}

/**
 * tile-layer:{uuid}/{id} => {id}
 */
export const containedId = id => {
  const index = id.lastIndexOf('/')
  return id.substring(index + 1)
}

export const scope = id => id.split(':')[0]

export const isId = prefix => id => id && id.startsWith(prefix)
export const isLayerId = isId('layer:')
export const isFeatureId = isId('feature:')
export const isMarkerId = isId('marker:')
export const isBookmarkId = isId('bookmark:')
export const isGroupId = isId('group:') // TODO: group -> view
export const isSymbolId = isId('symbol:')
export const isPlaceId = isId('place:')
export const isTileServiceId = isId('tile-service:')
export const isTilePresetId = isId('tile-preset:')
export const isLinkId = isId('link+')

export const isDeletableId = id => !isSymbolId(id)
export const isTaggableId = id => !isGroupId(id)
export const isProjectId = isId('project:')
export const isLockedId = isId('locked+')
export const isHiddenId = isId('hidden+')
export const isDefaultId = isId('default+')
export const isLockedFeatureId = isId('locked+feature:')
export const isHiddenFeatureId = isId('hidden+feature:')
export const isTagsId = isId('tags+')
export const isLayerTagsId = isId('tags+layer:')

export const isAssociatedId = id =>
  isHiddenId(id) ||
  isLockedId(id) ||
  isDefaultId(id) ||
  isTagsId(id)

export const FEATURE_ID = 'feature:[0-9a-f-]{36}/[0-9a-f-]{36}'
export const LAYER_ID = 'layer:[0-9a-f-]{36}'
export const PLACE_ID = 'place:[0-9a-f-]{36}'
export const GROUP_ID = 'group:[0-9a-f-]{36}'
export const SYMBOL_ID = 'symbol:[A-Z-*]{10}'
export const LINK_ID = 'link:[0-9a-f-]{36}'
export const PROJECT_ID = 'project:[0-9a-f-]{36}'
export const FIELD_ID = 'field:[0-9a-f-]{36}'

export const ord = R.cond([
  [isLayerId, R.always(0)],
  [isFeatureId, R.always(1)],
  [isMarkerId, R.always(2)],
  [isLinkId, R.always(3)],
  [isTagsId, R.always(4)],
  [isTileServiceId, R.always(5)]
])
