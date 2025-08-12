import util from 'util'
import Emitter from '../../shared/emitter'
import * as L from '../../shared/level'

const COORDINATES_FORMAT = 'coordinates-format'
const GRATICULE = 'graticule'
const TILE_LAYERS = 'tile-layers'
const SYMBOL_PROPERTIES_SHOWING = 'ui.symbolProperties.showing'

export default function PreferencesStore (preferencesDB, ipcRenderer) {
  Emitter.call(this)
  this.preferencesDB = preferencesDB
  this.ipcRenderer = ipcRenderer

  ;(async () => {
    const tuples = await L.tuples(preferencesDB)
    ipcRenderer.send('ipc:put:preferences', tuples)
  })()

  preferencesDB.on('put', (key, value) => {
    ipcRenderer.send('ipc:post:preferences', key, value)
    this.emit(key, { value })
  })

  preferencesDB.on('del', key => {
    ipcRenderer.send('ipc:del:preferences', key)
    this.emit(key, { value: undefined })
  })

  ipcRenderer.on('VIEW_COORDINATES_FORMAT', (_, format) => this.setCoordinatesFromat(format))
  ipcRenderer.on('VIEW_GRATICULE', (_, type, checked) => this.setGraticule(type, checked))
  ipcRenderer.on('VIEW_SHOW_SIDEBAR', (_, checked) => this.showSidebar(checked))
  ipcRenderer.on('VIEW_SHOW_TOOLBAR', (_, checked) => this.showToolbar(checked))
  ipcRenderer.on('VIEW_SHOW_SYMBOL_PROPERTIES', (_, checked) => this.showSymbolProperties(checked))
}

util.inherits(PreferencesStore, Emitter)

PreferencesStore.prototype.setCoordinatesFromat = async function (format) {
  await this.put(COORDINATES_FORMAT, format)
  this.emit('coordinatesFormatChanged', { format })
}

PreferencesStore.prototype.setGraticule = async function (type, checked) {
  if (!checked) this.preferencesDB.del(GRATICULE)
  else this.put(GRATICULE, type)
  this.emit('graticuleChanged', { type, checked })
}

PreferencesStore.prototype.showSidebar = function (checked) {
  this.put('ui.sidebar.showing', checked)
}

PreferencesStore.prototype.showToolbar = function (checked) {
  this.put('ui.toolbar.showing', checked)
}

PreferencesStore.prototype.showSymbolProperties = function (checked) {
  this.put(SYMBOL_PROPERTIES_SHOWING, checked)
}

PreferencesStore.prototype.getSymbolPropertiesShowing = function () {
  return this.get(SYMBOL_PROPERTIES_SHOWING, true)
}

/**
 * @deprecated
 */
PreferencesStore.prototype.putTileLayers = function (layers) {
  this.put(TILE_LAYERS, layers)
}

/**
 * @deprecated
 */
PreferencesStore.prototype.getTileLayers = function () {
  return this.get(TILE_LAYERS, [])
}

/**
 * @async
 * get :: string -> any -> any
 */
PreferencesStore.prototype.get = function (key, value) {
  return L.get(this.preferencesDB, key, value)
}


/**
 * @async
 * put :: string -> any
 */
PreferencesStore.prototype.put = function (key, value) {
  return this.preferencesDB.put(key, value)
}
