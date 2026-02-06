import { ipcRenderer } from 'electron'
import { reproject } from 'reproject'
import { readEntries } from '../../Clipboard'
import EventEmitter from '../../../shared/emitter'
import * as ID from '../../ids'


/**
 * Convert layer entries to GeoJSON FeatureCollection.
 * Reprojects geometries from EPSG:3857 to EPSG:4326 (WGS84).
 */
const toGeoJSON = (entries, layerName) => {
  const features = entries
    .filter(([key]) => ID.isFeatureId(key))
    .map(([, value]) => {
      const { geometry, properties, name } = value

      // Reproject from EPSG:3857 to EPSG:4326 (WGS84)
      const reprojectedGeometry = reproject(geometry, 'EPSG:3857', 'EPSG:4326')

      // Include name in properties if present
      const featureProperties = name
        ? { name, ...properties }
        : { ...properties }

      return {
        type: 'Feature',
        geometry: reprojectedGeometry,
        properties: featureProperties
      }
    })

  return {
    type: 'FeatureCollection',
    name: layerName,
    features
  }
}


/**
 *
 */
const SetDefaultLayer = function (services) {
  this.selection = services.selection
  this.store = services.store
  this.path = 'mdiCreation'
  this.toolTip = 'Make the selected layer the default layer'
  this.selection.on('selection', async () => {
    if (this.selected().length === 0) {
      this.isEnabled = false
    } else {
      const [restricted] = await this.store.collect(this.selection.selected()[0], [ID.restrictedId])
      this.isEnabled = !restricted
    }
    this.emit('changed')
  })
  this.isEnabled = false
}

Object.assign(SetDefaultLayer.prototype, EventEmitter.prototype)

SetDefaultLayer.prototype.execute = function () {
  this.store.setDefaultLayer(this.selected()[0])
}

SetDefaultLayer.prototype.enabled = function () {
  return this.isEnabled
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

/**
 * Factory for export layer commands.
 * Creates commands for exporting layers in different formats.
 */
const createExportLayerCommand = (format) => {
  const ExportLayerCommand = function (services) {
    this.selection = services.selection
    this.store = services.store
    this.clipboard = services.clipboard
    this.format = format
    this.path = format === 'geojson' ? 'mdiMapMarkerPath' : 'mdiExport'
    this.label = format === 'geojson' ? 'Export as GeoJSON' : 'Export as ODIN'
    this.toolTip = `Export selected layer as ${format === 'geojson' ? 'GeoJSON' : 'ODIN format'}`
    this.selection.on('selection', () => this.emit('changed'))
  }

  Object.assign(ExportLayerCommand.prototype, EventEmitter.prototype)

  ExportLayerCommand.prototype.execute = async function () {
    await this.clipboard.copy()
    const entries = await readEntries()
    const layerId = this.selected()[0]
    const layer = await this.store.value(layerId)

    if (this.format === 'geojson') {
      const content = toGeoJSON(entries, layer.name)
      ipcRenderer.send('EXPORT_LAYER', layer.name, content, 'geojson')
    } else {
      const content = { contentType: 'application/json;vnd=odin', entries }
      ipcRenderer.send('EXPORT_LAYER', layer.name, content, 'odin')
    }
  }

  ExportLayerCommand.prototype.enabled = function () {
    return this.selected().length === 1
  }

  ExportLayerCommand.prototype.selected = function () {
    return this.selection.selected().filter(ID.isLayerId)
  }

  return ExportLayerCommand
}

const ExportLayerODIN = createExportLayerCommand('odin')
const ExportLayerGeoJSON = createExportLayerCommand('geojson')

/**
 *
 */
export default services => ({
  LAYER_SET_DEFAULT: new SetDefaultLayer(services),
  LAYER_EXPORT_ODIN: new ExportLayerODIN(services),
  LAYER_EXPORT_GEOJSON: new ExportLayerGeoJSON(services),
  SELECT_TILE_LAYERS: new SelectTilePreset(services)
})
