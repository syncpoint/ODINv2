import EventEmitter from '../shared/emitter.js'

export const evented = new EventEmitter()

export const COMMAND = {
  CREATE_PROJECT: 'command.create.project',
  OPEN_PROJECT: 'command.open.project'
}

export const EVENT = {
  QUIT: 'event.quit',
  PROJECT_OPENED: 'event.project.opened'
}
