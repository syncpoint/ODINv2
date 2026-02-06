import * as ID from '../../ids'
import { militaryFormat } from '../../../shared/datetime'
import uuid from '../../../shared/uuid'

/**
 *
 */
const CreateLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'Create Layer'
  this.path = 'mdiLayersTriple'
}

CreateLayer.prototype.execute = async function () {
  const key = ID.layerId()
  await this.store.insert([[key, { name: `Layer - ${militaryFormat.now()}` }]])
  this.selection.focus(key)
}

/**
 *
 */
const CreateTileService = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'Create Tile Service'
  this.path = 'mdiEarth'
}

CreateTileService.prototype.execute = function () {
  const key = ID.tileServiceId()
  this.store.insert([[key, { type: 'OSM', url: '', name: '' }]])
  this.selection.focus(key)
}


/**
 *
 */
const CreateMarker = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.sessionStore = services.sessionStore
  this.label = 'Create Marker'
  this.path = 'mdiCrosshairs'
}

CreateMarker.prototype.execute = async function () {
  const viewport = await this.sessionStore.get('viewport')
  const key = ID.markerId()
  const value = {
    name: `Marker - ${militaryFormat.now()}`,
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: viewport.center
    }
  }

  this.store.insert([[key, value]])
  this.selection.focus(key)
}


/**
 *
 */
const CreateBookmark = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.sessionStore = services.sessionStore
  this.label = 'Create Bookmark'
  this.path = 'mdiBookmarkOutline'
}

CreateBookmark.prototype.execute = async function () {
  const viewport = await this.sessionStore.get('viewport')
  const key = ID.bookmarkId()
  const name = `Bookmark - ${militaryFormat.now()}`
  const value = { name, ...viewport }
  this.store.insert([[key, value]])
  this.selection.focus(key)
}

/**
 *
 */
const CreateSSEService = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'Create Live Data Source'
  this.path = 'mdiAccessPointNetwork'
}

CreateSSEService.prototype.execute = function () {
  const key = ID.sseServiceId()
  const layerId = uuid()
  this.store.insert([[key, {
    name: 'New Live Data Source',
    url: '',
    enabled: false,
    eventType: 'message',
    dataProjection: 'EPSG:4326',
    updateInterval: 100,
    featureIdPrefix: `feature:${layerId}/`,
    useFeatureIds: true
  }]])
  this.selection.focus(key)
}

/**
 *
 */
export default services => ({
  LAYER_CREATE: new CreateLayer(services),
  TILE_SERVICE_CREATE: new CreateTileService(services),
  MARKER_CREATE: new CreateMarker(services),
  BOOKMARK_CREATE: new CreateBookmark(services),
  SSE_SERVICE_CREATE: new CreateSSEService(services)
})
