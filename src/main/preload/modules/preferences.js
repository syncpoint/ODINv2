const { ipcRenderer } = require('electron')

module.exports = {
  putAll: (tuples) => ipcRenderer.send('ipc:put:preferences', tuples),
  post: (key, value) => ipcRenderer.send('ipc:post:preferences', key, value),
  del: (key) => ipcRenderer.send('ipc:del:preferences', key),
  onViewCoordinatesFormat: (handler) => {
    const listener = (_, format) => handler(format)
    ipcRenderer.on('VIEW_COORDINATES_FORMAT', listener)
    return () => ipcRenderer.removeListener('VIEW_COORDINATES_FORMAT', listener)
  },
  onViewGraticule: (handler) => {
    const listener = (_, type, checked) => handler(type, checked)
    ipcRenderer.on('VIEW_GRATICULE', listener)
    return () => ipcRenderer.removeListener('VIEW_GRATICULE', listener)
  },
  onViewShowSidebar: (handler) => {
    const listener = (_, checked) => handler(checked)
    ipcRenderer.on('VIEW_SHOW_SIDEBAR', listener)
    return () => ipcRenderer.removeListener('VIEW_SHOW_SIDEBAR', listener)
  },
  onViewShowToolbar: (handler) => {
    const listener = (_, checked) => handler(checked)
    ipcRenderer.on('VIEW_SHOW_TOOLBAR', listener)
    return () => ipcRenderer.removeListener('VIEW_SHOW_TOOLBAR', listener)
  },
  onViewMapQuality: (handler) => {
    const listener = (_, quality) => handler(quality)
    ipcRenderer.on('VIEW_MAP_QUALITY', listener)
    return () => ipcRenderer.removeListener('VIEW_MAP_QUALITY', listener)
  }
}
