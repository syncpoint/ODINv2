
import EventEmitter from '../../../shared/emitter'

const state = [
  {
    event: 'TOOLBAR_SCOPE/PRINT',
    path: 'mdiPrinterOutline',
    toolTip: 'Print ...'
  },
  {
    event: 'TOOLBAR_SCOPE/STANDARD',
    path: 'mdiExitToApp',
    toolTip: 'Return to the main application view'
  }
]

const PrintSwitchScopeCommand = function (services) {
  this.emitter = services.emitter
  this.currentState = 0
}

Object.assign(PrintSwitchScopeCommand.prototype, EventEmitter.prototype)

PrintSwitchScopeCommand.prototype.execute = function () {
  this.emitter.emit(state[this.currentState].event)
  this.currentState = (this.currentState + 1) % 2
  this.emit('changed')
}

PrintSwitchScopeCommand.prototype.enabled = function () { return true }

const PrintCommand = function (services) {
  this.emitter = services.emitter
  this.path = 'mdiPrinter'
  this.toolTip = 'Print this view now!'
}

PrintCommand.prototype.execute = function () {
  this.emitter.emit('PRINT')
}

const buildScopeCommand = (services) => {
  const command = new PrintSwitchScopeCommand(services)
  Object.defineProperty(command, 'path', { get () { return state[this.currentState].path } })
  Object.defineProperty(command, 'toolTip', { get () { return state[this.currentState].toolTip } })
  return command
}

export default services => ({
  PRINT_SWITCH_SCOPE: buildScopeCommand(services),
  PRINT_MAP: new PrintCommand(services)
})
