import EventEmitter from '../shared/emitter.js'

export const evented = new EventEmitter()

export const COMMAND = {
  CREATE_WINDOW: 'command.create.window'
}

export const EVENT = {
  QUIT: 'event.quit'
}
