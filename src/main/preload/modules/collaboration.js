const { ipcRenderer } = require('electron')

module.exports = {
  purge: () => ipcRenderer.invoke('PURGE_COLLABORATION_SETTINGS'),
  reloadAllWindows: () => ipcRenderer.postMessage('RELOAD_ALL_WINDOWS'),
  refreshLogin: () => ipcRenderer.postMessage('COLLABORATION_REFRESH_LOGIN')
}
