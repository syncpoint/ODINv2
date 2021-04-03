import EventEmitter from '../shared/emitter.js'

export const evented = new EventEmitter()

export const EVENT = {
  STORE_READY: 'event.store.ready'
}
