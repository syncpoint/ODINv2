import { ipcRenderer } from 'electron'
import { readEntries } from '../../Clipboard'
import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'


/**
 *
 */
const SetDefaultLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.path = 'mdiCreation'
  this.toolTip = 'Make the selected layer the default layer'
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
  this.toolTip = 'Change the visibility of the background maps'
  this.path = 'mdiMap'
}

SelectTilePreset.prototype.execute = async function () {
  this.preferencesStore.put('ui.properties', 'properties')
  this.selection.set([ID.defaultTilePresetId])
}

const ExportLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.clipboard = services.clipboard
  this.path = 'mdiExport'
  this.toolTip = 'Export selected layer to the filesystem'
  this.selection.on('selection', () => this.emit('changed'))
}

Object.assign(ExportLayer.prototype, EventEmitter.prototype)

ExportLayer.prototype.execute = async function () {
  const layerId = this.selected()[0]
  const layer = await this.store.value(layerId)

  await this.clipboard.copy()
  const entries = await readEntries()
  const content = {
    contentType: 'application/json;vnd=odin',
    entries
  }

  ipcRenderer.send('EXPORT_LAYER', layer.name, content)
}
ExportLayer.prototype.enabled = function () {
  return this.selected().length === 1
}

ExportLayer.prototype.selected = function () {
  return this.selection.selected().filter(ID.isLayerId)
}

/**
 *
 */
export default services => ({
  LAYER_SET_DEFAULT: new SetDefaultLayer(services),
  LAYER_EXPORT: new ExportLayer(services),
  SELECT_TILE_LAYERS: new SelectTilePreset(services)
})
