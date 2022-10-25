import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'


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


const SelectTilePreset = function (services) {
  this.selection = services.selection
  this.preferencesStore = services.preferencesStore
  this.store = services.store
  this.tileLayerStore = services.tileLayerStore
  this.path = 'mdiMap'
}

SelectTilePreset.prototype.execute = async function () {
  this.preferencesStore.put('ui.properties', 'properties')
  this.selection.set([ID.defaultTilePresetId])
}


/**
 *
 */
export default services => ({
  LAYER_SET_DEFAULT: new SetDefaultLayer(services),
  SELECT_TILE_LAYERS: new SelectTilePreset(services)
})
