import util from 'util'
import Emitter from '../../shared/emitter'

export function PreferencesStore (preferencesLevel) {
  Emitter.call(this)
  this.preferences_ = preferencesLevel
}

util.inherits(PreferencesStore, Emitter)
