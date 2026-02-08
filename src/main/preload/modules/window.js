const { ipcRenderer } = require('electron')

module.exports = {
  close: (handle) => ipcRenderer.postMessage('CLOSE_WINDOW', handle),
  refreshMenu: () => ipcRenderer.postMessage('REFRESH_MENU'),
  onEnterFullscreen: (handler) => {
    const listener = () => handler()
    ipcRenderer.on('IPC_ENTER_FULLSCREEN', listener)
    return () => ipcRenderer.removeListener('IPC_ENTER_FULLSCREEN', listener)
  },
  onLeaveFullscreen: (handler) => {
    const listener = () => handler()
    ipcRenderer.on('IPC_LEAVE_FULLSCREEN', listener)
    return () => ipcRenderer.removeListener('IPC_LEAVE_FULLSCREEN', listener)
  },
  onProjectClosed: (handler) => {
    const listener = () => handler()
    ipcRenderer.on('ipc:post:project/closed', listener)
    return () => ipcRenderer.removeListener('ipc:post:project/closed', listener)
  }
}
