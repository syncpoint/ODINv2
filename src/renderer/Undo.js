const unshift = stack => command => stack.unshift(command)

/**
 * Apply command from first stack and
 * move inverse command to other stack.
 */
const shift = ([head, ...tail], to) => {
  if (!head) return []
  head.apply()
  unshift(to, head.inverse())
  return tail
}

export function Undo () {
  this.undoStack = []
  this.redoStack = []
}

/**
 * Invoke apply() function of topmost command on undo stack.
 * Push inverse command unto redo stack.
 */
Undo.prototype.undo = function () {
  this.undoStack = shift(this.undoStack, this.redoStack)
}

/**
 * Invoke apply() function of topmost command on redo stack.
 * Push inverse command unto redo stack.
 */
Undo.prototype.redo = function () {
  this.redoStack = shift(this.redoStack, this.undoStack)
}

/**
 * Push a command unto the undo stack.
 *
 * Command object must conform to the following properties:
 * - command#apply() - reverts changes of the command
 * - command#inverse() - yields valid inverse of command
 */
Undo.prototype.push = function (command) {
  unshift(this.undoStack, command)
}

Undo.prototype.canUndo = function () {
  return this.undoStack.length > 0
}

Undo.prototype.canRedo = function () {
  return this.redoStack.length > 0
}
