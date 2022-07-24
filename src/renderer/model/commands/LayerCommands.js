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
const SelectTilePreset = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.tileLayerStore = services.tileLayerStore
  this.path = 'mdiMap'
}

SelectTilePreset.prototype.execute = async function () {
  this.selection.set([ID.defaultTilePresetId])
}

export default services => ({
  LAYER_SET_DEFAULT: new SetDefaultLayer(services),
  LAYER_CREATE: new CreateLayer(services),
  TILE_SERVICE_CREATE: new CreateTileService(services),
  SELECT_TILE_LAYERS: new SelectTilePreset(services)
})
