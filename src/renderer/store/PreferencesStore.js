import util from 'util'
import Emitter from '../../shared/emitter'

export function PreferencesStore (preferencesLevel) {
  Emitter.call(this)
  this.preferences_ = preferencesLevel
}

util.inherits(PreferencesStore, Emitter)


/**
 * @async
 * get :: string -> any -> any
 */
PreferencesStore.prototype.get = async function (key, defaultValue) {
  try {
    return await this.preferences_.get(key)
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
  return this.preferences_.put(key, value)
}
