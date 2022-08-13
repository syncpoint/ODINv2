import EventEmitter from '../../../shared/emitter'
import * as R from 'ramda'

const Pin = function (services) {
  this.store = services.store
  this.selection = services.selection
  this.path = 'mdiPinOutline'
  this.selection.on('selection', () => this.emit('changed'))
}

Object.assign(Pin.prototype, EventEmitter.prototype)

Pin.prototype.execute = function () {
  const selected = this.selected()
  this.store.addTag(R.last(selected), 'pin')
}

Pin.prototype.enabled = function () {
  return this.selected().length !== 0
}

Pin.prototype.selected = function () {
  return this.selection.selected()
}

export default services => ({
  PIN: new Pin(services)
})
