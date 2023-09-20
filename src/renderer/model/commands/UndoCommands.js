import EventEmitter from '../../../shared/emitter'

/** */
const Undo = function (services) {
  this.undo = services.undo
  this.path = 'mdiUndo'
  this.toolTip = 'Undo'
  this.undo.on('changed', () => this.emit('changed'))
}

Object.assign(Undo.prototype, EventEmitter.prototype)
Undo.prototype.execute = function () { this.undo.undo() }
Undo.prototype.enabled = function () { return this.undo.canUndo() }

/** */
const Redo = function (services) {
  this.undo = services.undo
  this.path = 'mdiRedo'
  this.toolTip = 'Redo'
  this.undo.on('changed', () => this.emit('changed'))
}

Object.assign(Redo.prototype, EventEmitter.prototype)
Redo.prototype.execute = function () { this.undo.redo() }
Redo.prototype.enabled = function () { return this.undo.canRedo() }

export default services => ({
  UNDO_UNDO: new Undo(services),
  UNDO_REDO: new Redo(services)
})
