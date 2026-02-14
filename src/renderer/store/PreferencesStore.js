import util from 'util'
import Emitter from '../../shared/emitter'
import * as L from '../../shared/level'

const COORDINATES_FORMAT = 'coordinates-format'
const GRATICULE = 'graticule'
const TILE_LAYERS = 'tile-layers'

export default function PreferencesStore (preferencesDB, prefsBridge) {
  Emitter.call(this)
  this.preferencesDB = preferencesDB

  ;(async () => {
    const tuples = await L.tuples(preferencesDB)
    prefsBridge.putAll(tuples)
  })()

  preferencesDB.on('put', (key, value) => {
    prefsBridge.post(key, value)
    this.emit(key, { value })
  })

  preferencesDB.on('del', key => {
    prefsBridge.del(key)
    this.emit(key, { value: undefined })
  })

  this.unsubscribers = [
    prefsBridge.onViewCoordinatesFormat(format => this.setCoordinatesFromat(format)),
    prefsBridge.onViewGraticule((type, checked) => this.setGraticule(type, checked)),
    prefsBridge.onViewShowSidebar(checked => this.showSidebar(checked)),
    prefsBridge.onViewShowToolbar(checked => this.showToolbar(checked)),
    prefsBridge.onViewMapQuality(quality => this.setMapQuality(quality))
  ]
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

PreferencesStore.prototype.setMapQuality = function (quality) {
  this.put('map.quality', quality)
  this.emit('mapQualityChanged', { quality })
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
