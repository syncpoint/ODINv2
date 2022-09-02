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


const CreateLineMeasurement = function (services) {
  this.store = services.store
}

CreateLineMeasurement.prototype.execute = async function () {
  const key = ID.measurementId()
  const value = {
    name: 'Längenmessung',
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [1745619.6249644305, 6073561.340117655],
        [1745916.1371714617, 6177158.290068827],
        [1781616.498255446, 6280224.427886209],
        [1811918.566614821, 6320235.88894578]]
    }
  }

  this.store.insert([[key, value]])
}


/**
 *
 */
export default services => ({
  LAYER_CREATE: new CreateLayer(services),
  TILE_SERVICE_CREATE: new CreateTileService(services),
  MARKER_CREATE: new CreateMarker(services),
  BOOKMARK_CREATE: new CreateBookmark(services)
})
