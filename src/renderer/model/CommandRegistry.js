import uuid from 'uuid-random'
import globalCommands from './commands/GlobalCommands'
import undoCommands from './commands/UndoCommands'
import clipboardCommands from './commands/ClipboardCommands'
import layerCommands from './commands/LayerCommands'
import creationCommand from './commands/CreationCommands'

/**
 *
 */
export function CommandRegistry (services) {
  this.separator = () => [uuid(), 'separator']
  Object.assign(this, globalCommands(services))
  Object.assign(this, clipboardCommands(services))
  Object.assign(this, undoCommands(services))
  Object.assign(this, layerCommands(services))
  Object.assign(this, creationCommand(services))

  this.VIEW_CREATE = {
    label: 'Create View'
  }
}

CommandRegistry.prototype.command = function (key) {
  return [key, this[key]]
}
