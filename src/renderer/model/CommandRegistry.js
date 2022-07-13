import uuid from 'uuid-random'
import * as ID from '../ids'
import { militaryFormat } from '../../shared/datetime'
import UndoCommands from './commands/UndoCommands'
import ClipboardCommands from './commands/ClipboardCommands'

/**
 *
 */
export function CommandRegistry (services) {
  const { selection, store, viewMemento } = services

  this.separator = () => [uuid(), 'separator']
  Object.assign(this, ClipboardCommands(services))
  Object.assign(this, UndoCommands(services))


  this.LAYER_CREATE = {
    label: 'Create Layer',
    execute: () => {
      const key = ID.layerId()
      selection.set([key])
      store.insert([[key, { name: `Layer - ${militaryFormat.now()}` }]])
    }
  }

  this.MARKER_CREATE = {
    label: 'Create Marker',
    execute: () => {
      const key = ID.markerId()
      selection.set([key])
      store.insert([[key, {
        name: `Marker - ${militaryFormat.now()}`,
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: viewMemento.center()
        }
      }]])
    }
  }

  this.VIEW_CREATE = {
    label: 'Create View'
  }
}

CommandRegistry.prototype.command = function (key) {
  return [key, this[key]]
}
