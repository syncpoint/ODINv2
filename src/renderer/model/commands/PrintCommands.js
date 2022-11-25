
import EventEmitter from '../../../shared/emitter'

const state = [
  {
    event: 'TOOLBAR_SCOPE/PRINT',
    path: 'mdiPrinterOutline'
  },
  {
    event: 'TOOLBAR_SCOPE/STANDARD',
    path: 'mdiExitToApp'
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
}

PrintCommand.prototype.execute = function () {
  this.emitter.emit('PRINT')
}

export default services => ({
  PRINT_SWITCH_SCOPE: Object.defineProperty(new PrintSwitchScopeCommand(services), 'path', { get () { return state[this.currentState].path } }),
  PRINT_MAP: new PrintCommand(services)
})
