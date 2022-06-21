import util from 'util'
import Emitter from '../../shared/emitter'
import * as L from '../../shared/level'

export function PreferencesStore (preferencesDB, ipcRenderer) {
  Emitter.call(this)
  this.preferencesDB = preferencesDB
  this.ipcRenderer = ipcRenderer

  ;(async () => {
    const tuples = await L.tuples(preferencesDB)
    ipcRenderer.send('ipc:put:preferences', tuples)
  })()

  preferencesDB.on('put', (key, value) => ipcRenderer.send('ipc:post:preferences', key, value))
  preferencesDB.on('del', key => ipcRenderer.send('ipc:del:preferences', key))

  ipcRenderer.on('VIEW_COORDINATES_FORMAT', (_, format) => this.setCoordinatesFromat(format))
}

util.inherits(PreferencesStore, Emitter)

PreferencesStore.prototype.setCoordinatesFromat = async function (format) {
  await this.put('coordinates-format', format)
  this.emit('coordinatesFormatChanged', { format })
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
  this.emit(key, value)
  return this.preferencesDB.put(key, value)
}
