import uuid from 'uuid-random'
import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'
import { militaryFormat } from '../../../shared/datetime'


/**
 *
 */
const SetDefaultLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.path = 'mdiCreation'
  this.selection.on('selection', () => this.emit('changed'))
}

Object.assign(SetDefaultLayer.prototype, EventEmitter.prototype)

SetDefaultLayer.prototype.execute = function () {
  this.store.setDefaultLayer(this.selected()[0])
}

SetDefaultLayer.prototype.enabled = function () {
  return this.selected().length === 1
}

SetDefaultLayer.prototype.selected = function () {
  return this.selection.selected().filter(ID.isLayerId)
}


/**
 *
 */
const CreateLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'Create Layer'
}

CreateLayer.prototype.execute = function () {
  const key = ID.layerId()
  this.selection.set([key])
  this.store.insert([[key, { name: `Layer - ${militaryFormat.now()}` }]])
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
  this.selection.set([key])
  this.store.insert([[key, { type: 'OSM', url: '', name: '' }]])
}


/**
 *
 */
const SelectTileLayers = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.path = 'mdiMap'
}

SelectTileLayers.prototype.execute = async function () {
  const layerSets = await this.store.keys('tile-layers:')

  if (layerSets.length === 0) {
    // Create default set with available layers from all tile services
    const layers = await this.store.keys(ID.tileLayerId())

    const key = `tile-layers:${uuid()}`
    this.selection.set([key])
    this.store.insert([[key, layers]])
  } else {
    // Select first layers set.
    // We might define something like default set at a later time.
    this.selection.set([layerSets[0]])
  }
}

export default services => ({
  LAYER_SET_DEFAULT: new SetDefaultLayer(services),
  LAYER_CREATE: new CreateLayer(services),
  TILE_SERVICE_CREATE: new CreateTileService(services),
  SELECT_TILE_LAYERS: new SelectTileLayers(services)
})
