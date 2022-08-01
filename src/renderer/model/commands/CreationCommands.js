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
const CreateMarker = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.viewMemento = services.viewMemento
  this.label = 'Create Marker'
}

CreateMarker.prototype.execute = function () {
  const key = ID.markerId()
  this.store.insert([[key, {
    name: `Marker - ${militaryFormat.now()}`,
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: this.viewMemento.center()
    }
  }]])

  this.selection.focus(key)
}


/**
 *
 */
const CreateBookmark = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.viewMemento = services.viewMemento
  this.label = 'Create Bookmark'
}

CreateBookmark.prototype.execute = function () {
  const key = ID.bookmarkId()
  const value = {
    name: `Bookmark - ${militaryFormat.now()}`,
    center: this.viewMemento.center(),
    resolution: this.viewMemento.resolution(),
    rotation: this.viewMemento.rotation()
  }

  this.store.insert([[key, value]])
  this.selection.focus(key)
}


/**
 *
 */
export default services => ({
  LAYER_CREATE: new CreateLayer(services),
  MARKER_CREATE: new CreateMarker(services),
  BOOKMARK_CREATE: new CreateBookmark(services)
})
