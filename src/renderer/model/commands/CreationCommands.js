import * as ID from '../../ids'
import { militaryFormat } from '../../../shared/datetime'

/**
 *
 */
const CreateLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'Create Layer'
}

CreateLayer.prototype.execute = async function () {
  const key = ID.layerId()
  await this.store.insert([[key, { name: `Layer - ${militaryFormat.now()}` }]])
  this.selection.focus(key)
}


const CreateInvitedLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'FAKE invited layer'
}

CreateInvitedLayer.prototype.execute = async function () {
  const key = ID.invitationId()
  const name = `INVITED Layer - ${militaryFormat.now()}`
  await this.store.insert([[key, { name }]])
  this.selection.focus(key)
  console.log(`Created new FAKE invitation ${key}`)
}


/**
 *
 */
const CreateTileService = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'Create Tile Service'
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
export default services => ({
  LAYER_CREATE: new CreateLayer(services),
  INVITED_LAYER_CREATE: new CreateInvitedLayer(services),
  TILE_SERVICE_CREATE: new CreateTileService(services),
  MARKER_CREATE: new CreateMarker(services),
  BOOKMARK_CREATE: new CreateBookmark(services)
})
