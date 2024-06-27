import uuid from '../../shared/uuid'
import globalCommands from './commands/GlobalCommands'
import undoCommands from './commands/UndoCommands'
import clipboardCommands from './commands/ClipboardCommands'
import layerCommands from './commands/LayerCommands'
import creationCommand from './commands/CreationCommands'
import measureCommands from './commands/MeasureCommands'
import printCommands from './commands/PrintCommands'
import replicationCommands from './commands/ReplicationCommands'

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
  Object.assign(this, measureCommands(services))
  Object.assign(this, printCommands(services))
  Object.assign(this, replicationCommands(services))

  this.VIEW_CREATE = {
    label: 'Create View'
  }
}

CommandRegistry.prototype.command = function (key) {
  return [key, this[key]]
}
