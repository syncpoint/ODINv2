import EventEmitter from '../../../shared/emitter'
import { isLayerId, layerId, tileServiceId } from '../../ids'
import { militaryFormat } from '../../../shared/datetime'

/** */
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
  return this.selection.selected().filter(isLayerId)
}

/** */
const CreateLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'Create Layer'
}

CreateLayer.prototype.execute = function () {
  const key = layerId()
  this.selection.set([key])
  this.store.insert([[key, { name: `Layer - ${militaryFormat.now()}` }]])
}

/** */
const CreateTileService = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.label = 'Create Tile Service'
}

CreateTileService.prototype.execute = function () {
  const key = tileServiceId()
  this.selection.set([key])
  this.store.insert([[key, { type: 'OSM', url: '', name: '' }]])
}

export default services => ({
  LAYER_SET_DEFAULT: new SetDefaultLayer(services),
  LAYER_CREATE: new CreateLayer(services),
  TILE_SERVICE_CREATE: new CreateTileService(services)
})
