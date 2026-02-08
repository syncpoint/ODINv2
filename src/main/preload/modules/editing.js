const { ipcRenderer } = require('electron')

module.exports = {
  doUndo: () => ipcRenderer.send('DO_UNDO'),
  doRedo: () => ipcRenderer.send('DO_REDO'),
  onUndo: (handler) => {
    const listener = () => handler()
    ipcRenderer.on('EDIT_UNDO', listener)
    return () => ipcRenderer.removeListener('EDIT_UNDO', listener)
  },
  onRedo: (handler) => {
    const listener = () => handler()
    ipcRenderer.on('EDIT_REDO', listener)
    return () => ipcRenderer.removeListener('EDIT_REDO', listener)
  },
  onSelectAll: (handler) => {
    const listener = () => handler()
    ipcRenderer.on('EDIT_SELECT_ALL', listener)
    return () => ipcRenderer.removeListener('EDIT_SELECT_ALL', listener)
  }
}
