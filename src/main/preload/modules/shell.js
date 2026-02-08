const { ipcRenderer } = require('electron')

module.exports = {
  openLink: (link) => ipcRenderer.send('OPEN_LINK', link),
  openProject: (id) => ipcRenderer.send('OPEN_PROJECT', id),
  exportProject: (id) => ipcRenderer.send('EXPORT_PROJECT', id),
  exportLayer: (name, content, format) => ipcRenderer.send('EXPORT_LAYER', name, content, format),
  sendPreview: (url) => ipcRenderer.send('PREVIEW', url),
  saveFile: (fileName, data, filters) => ipcRenderer.invoke('SAVE_FILE', fileName, data, filters)
}
