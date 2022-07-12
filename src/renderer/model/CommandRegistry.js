import uuid from 'uuid-random'
import * as ID from '../ids'
import { militaryFormat } from '../../shared/datetime'

/**
 *
 */
export function CommandRegistry (services) {
  const { clipboard, undo, selection, store, viewMemento } = services

  this.separator = () => [uuid(), 'separator']

  this.CLIPBOARD_CUT = { path: 'mdiContentCut', execute: () => clipboard.cut() }
  this.CLIPBOARD_COPY = { path: 'mdiContentCopy', execute: () => clipboard.copy() }
  this.CLIPBOARD_PASTE = { path: 'mdiContentPaste', execute: () => clipboard.paste() }
  this.CLIPBOARD_DELETE = { path: 'mdiTrashCanOutline', execute: () => clipboard.delete() }
  this.UNDO_UNDO = { path: 'mdiUndo', execute: () => undo.undo() }
  this.UNDO_REDO = { path: 'mdiRedo', execute: () => undo.redo() }

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
      const feature = {
        name: `Marker - ${militaryFormat.now()}`,
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: viewMemento.center()
        }
      }

      const key = ID.markerId()
      selection.set([key])
      store.insert([[key, feature]])
    }
  }

  this.VIEW_CREATE = {
    label: 'Create View'
  }
}

CommandRegistry.prototype.command = function (key) {
  return [key, this[key]]
}
