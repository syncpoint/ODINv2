import EventEmitter from '../shared/emitter'

export function Undo () {
  this.undoStack = []
  this.redoStack = []
}

Object.assign(Undo.prototype, EventEmitter.prototype)

Undo.prototype.unshift = function (stack, command) {
  stack.unshift(command)
  this.emit('changed', { canUndo: this.canUndo(), canRedo: this.canRedo() })
}

/**
 * Apply command from first stack and
 * move inverse command to other stack.
 */
Undo.prototype.shift = async function ([head, ...tail], to) {
  if (!head) return []
  await head.apply()
  this.unshift(to, await head.inverse())
  return tail
}


/**
 * Invoke apply() function of topmost command on undo stack.
 * Push inverse command unto redo stack.
 */
Undo.prototype.undo = async function () {
  this.undoStack = await this.shift(this.undoStack, this.redoStack)
}

/**
 * Invoke apply() function of topmost command on redo stack.
 * Push inverse command unto redo stack.
 */
Undo.prototype.redo = async function () {
  this.redoStack = await this.shift(this.redoStack, this.undoStack)
}

/**
 * Apply command and push inverse unto the undo stack.
 *
 * Command object must conform to the following properties:
 * - command#apply() - apply the command, might be asynchronous
 * - command#inverse() - yields valid inverse of command, must be synchronous
 */
Undo.prototype.apply = async function (command) {
  await command.apply()
  this.redoStack = []
  this.unshift(this.undoStack, await command.inverse())
}

Undo.prototype.canUndo = function () {
  return this.undoStack.length > 0
}

Undo.prototype.canRedo = function () {
  return this.redoStack.length > 0
}

Undo.prototype.command = function (apply, inverse) {
  return { apply, inverse }
}

Undo.prototype.composite = function (commands) {
  return {
    apply: () => Promise.all(commands.map(command => command.apply())),
    inverse: () => this.composite(commands.reverse().map(command => command.inverse()))
  }
}
