import util from 'util'
import Emitter from '../../shared/emitter'

export function PreferencesStore (preferencesDB) {
  Emitter.call(this)
  this.preferencesDB = preferencesDB
}

util.inherits(PreferencesStore, Emitter)


/**
 * @async
 * get :: string -> any -> any
 */
PreferencesStore.prototype.get = async function (key, defaultValue) {
  try {
    return await this.preferencesDB.get(key)
  } catch (err) {
    return defaultValue
  }
}


/**
 * @async
 * put :: string -> any
 */
PreferencesStore.prototype.put = function (key, value) {
  this.emit(key, value)
  return this.preferencesDB.put(key, value)
}
