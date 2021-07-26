const unshift = (stack, command) => stack.unshift(command)

/**
 * Apply command from first stack and
 * move inverse command to other stack.
 */
const shift = async ([head, ...tail], to) => {
  if (!head) return []
  await head.apply()
  unshift(to, head.inverse())
  return tail
}

export function Undo (ipcRenderer) {
  this.undoStack = []
  this.redoStack = []

  ipcRenderer.on('EDIT_UNDO', () => console.log('IPC:EDIT_UNDO', document.activeElement, this.canUndo()))
  ipcRenderer.on('EDIT_REDO', () => console.log('IPC:EDIT_REDO', document.activeElement, this.canRedo()))
}

/**
 * Invoke apply() function of topmost command on undo stack.
 * Push inverse command unto redo stack.
 */
Undo.prototype.undo = async function () {
  this.undoStack = await shift(this.undoStack, this.redoStack)
}

/**
 * Invoke apply() function of topmost command on redo stack.
 * Push inverse command unto redo stack.
 */
Undo.prototype.redo = async function () {
  this.redoStack = await shift(this.redoStack, this.undoStack)
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
  unshift(this.undoStack, command.inverse())
}

Undo.prototype.canUndo = function () {
  return this.undoStack.length > 0
}

Undo.prototype.canRedo = function () {
  return this.redoStack.length > 0
}
