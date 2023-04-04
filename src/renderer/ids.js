import * as R from 'ramda'
import uuid from 'uuid-random'

export const isUUID = uuid.test

export const PLUS = '+'
export const COLON = ':'
export const SLASH = '/'

export const PROJECT = 'project'
export const LAYER = 'layer'
export const FEATURE = 'feature'
export const MARKER = 'marker'
export const BOOKMARK = 'bookmark'
export const VIEW = 'view'
export const SYMBOL = 'symbol'
export const PLACE = 'place'
export const TILE_SERVICE = 'tile-service'
export const TILE_PRESET = 'tile-preset'
export const TILE_LAYER = 'tile-layer'
export const LINK = 'link'
export const STYLE = 'style'
export const LOCKED = 'locked'
export const HIDDEN = 'hidden'
export const DEFAULT = 'default'
export const TAGS = 'tags'
export const STICKY = 'sticky'
export const MEASURE = 'measure'
export const SHARED = 'shared'
export const INVITED = 'invited'

export const PROJECT_SCOPE = PROJECT + COLON
export const LAYER_SCOPE = LAYER + COLON
export const FEATURE_SCOPE = FEATURE + COLON
export const MARKER_SCOPE = MARKER + COLON
export const BOOKMARK_SCOPE = BOOKMARK + COLON
export const VIEW_SCOPE = VIEW + COLON
export const SYMBOL_SCOPE = SYMBOL + COLON
export const PLACE_SCOPE = PLACE + COLON
export const TILE_SERVICE_SCOPE = TILE_SERVICE + COLON
export const TILE_PRESET_SCOPE = TILE_PRESET + COLON
export const TILE_LAYER_SCOPE = TILE_LAYER + COLON
export const MEASURE_SCOPE = MEASURE + COLON

export const LINK_PREFIX = 'link' + PLUS
export const STYLE_PREFIX = 'style' + PLUS
export const LOCKED_PREFIX = 'locked' + PLUS
export const HIDDEN_PREFIX = 'hidden' + PLUS
export const DEFAULT_PREFIX = 'default' + PLUS
export const TAGS_PREFIX = 'tags' + PLUS
export const SHARED_LAYER_PREFIX = SHARED + PLUS

export const scope = s => s.split(COLON)[0]
export const ids = s => s.split(COLON)[1]
export const nthId = R.curry((n, s) => ids(s).split(SLASH)[n])

// TODO: generalize to more than one scope
export const dropScope = s => s.split(PLUS)[1]
export const makeScope = (scope, prefix) => R.isNil(prefix)
  ? scope + COLON
  : prefix + PLUS + scope + COLON

export const makeId = (scope, ...uuids) => scope + COLON + uuids.join(SLASH)

/**
 * layer:{uuid} -> link+layer:{uuid}
 * feature:{uuid}/(uuid) -> link+feature:{uuid}/uuid
 */
export const prefix = prefix => id => `${prefix}+${id || ''}`
export const lockedId = prefix(LOCKED)
export const hiddenId = prefix(HIDDEN)
export const stickyId = prefix(STICKY)
export const sharedId = prefix(SHARED)
export const invitedId = prefix(INVITED)
export const defaultId = prefix(DEFAULT)
export const tagsId = prefix(TAGS)
export const styleId = prefix(STYLE)

export const isId = prefix => id => id && id.startsWith(prefix)
export const isProjectId = isId(PROJECT_SCOPE)
export const isLayerId = isId(LAYER_SCOPE)
export const isFeatureId = isId(FEATURE_SCOPE)
export const isMarkerId = isId(MARKER_SCOPE)
export const isBookmarkId = isId(BOOKMARK_SCOPE)
export const isViewId = isId(VIEW_SCOPE)
export const isSymbolId = isId(SYMBOL)
export const isPlaceId = isId(PLACE_SCOPE)
export const isTileServiceId = isId(TILE_SERVICE_SCOPE)
export const isTileLayerId = isId(TILE_LAYER_SCOPE)
export const isTilePresetId = isId(TILE_PRESET_SCOPE)
export const isLinkId = isId(LINK_PREFIX)
export const isStyleId = isId(STYLE_PREFIX)
export const isLayerStyleId = isId(styleId(LAYER_SCOPE))
export const isFeatureStyleId = isId(styleId(FEATURE_SCOPE))
export const isLockedId = isId(LOCKED_PREFIX)
export const isHiddenId = isId(HIDDEN_PREFIX)
export const isDefaultId = isId(DEFAULT_PREFIX)
export const isTagsId = isId(TAGS_PREFIX)
export const isMeasureId = isId(MEASURE_SCOPE)
export const isSharedLayerId = isId(sharedId(LAYER_SCOPE))

export const isStylableId = R.anyPass([isLayerId, isFeatureId])
export const isDeletableId = id => !isSymbolId(id)
export const isTaggableId = id => !isViewId(id)
export const isAssociatedId = R.anyPass([isHiddenId, isLockedId, isDefaultId, isTagsId])

export const layerUUID = R.cond([
  [isFeatureId, nthId(0)],
  [isLayerId, nthId(0)]
])

/**
 * featureId :: '...+feature:' -> FeatureId
 * featureId :: LayerId -> FeatureId
 */
export const featureId = R.cond([
  [R.includes(makeScope(FEATURE, '')), dropScope],
  [R.T, layerId => makeId(FEATURE, ids(layerId), uuid())]
])


/**
 * layerId :: () -> LayerId
 * layerId :: FeatureId -> LayerId
 * layerId :: LayerId -> LayerId
 * layerId :: '...+layer:' -> LayerId
 */
export const layerId = R.cond([
  [R.isNil, () => makeId(LAYER, uuid())],
  [isFeatureId, x => makeId(LAYER, nthId(0, x))],
  [isLayerId, R.identity],
  [R.includes(makeScope(LAYER, '')), dropScope]
])


/**
 * tileServiceId :: () -> TileServiceId
 * tileServiceId :: TileLayerId -> TileServiceId
 */
export const tileServiceId = R.cond([
  [R.isNil, () => makeId(TILE_SERVICE, uuid())],
  [isTileLayerId, x => makeId(TILE_SERVICE, nthId(0, x))]
])


/**
 * tileLayerId :: TileServiceId -> TileLayerId [OSM, XYZ]
 * tileLayerId :: (TileServiceId, String) -> TileLayerId [WMS, WMTS]
 */
export const tileLayerId = (tileServiceId, layerId) =>
  layerId
    ? makeId(TILE_LAYER, ids(tileServiceId), layerId)
    : makeId(TILE_LAYER, ids(tileServiceId))

export const markerId = () => makeId(MARKER, uuid())
export const bookmarkId = () => makeId(BOOKMARK, uuid())
export const measureId = () => makeId(MEASURE, uuid())
export const linkId = id => LINK + PLUS + id + SLASH + uuid()
export const invitationId = () => makeId(INVITED, uuid())


/** Only a single preset (for now.) */
export const defaultTileServiceId = `${TILE_SERVICE_SCOPE}00000000-0000-0000-0000-000000000000`
export const defaultTileLayerId = `${TILE_LAYER_SCOPE}00000000-0000-0000-0000-000000000000`
export const defaultTilePresetId = `${TILE_PRESET_SCOPE}00000000-0000-0000-0000-000000000000`
export const tilePresetId = () => defaultTilePresetId
export const defaultStyleId = 'style+default:'

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
 * tile-layer:{uuid}/{id} => {id}
 */
export const containedId = id => {
  const index = id.lastIndexOf('/')
  return id.substring(index + 1)
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

export const ord = R.cond([
  [isLayerId, R.always(0)],
  [isFeatureId, R.always(1)],
  [isMarkerId, R.always(2)],
  [isLinkId, R.always(3)],
  [isTagsId, R.always(4)],
  [isStyleId, R.always(5)],
  [isTileServiceId, R.always(6)]
])
