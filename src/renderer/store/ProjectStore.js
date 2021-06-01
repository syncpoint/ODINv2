
/**
 *
 */
export function ProjectStore (ipcRenderer) {
  this.ipcRenderer = ipcRenderer
}


/**
 * @async
 */
ProjectStore.prototype.getProjects = function () {
  return this.ipcRenderer.invoke('ipc:get:projects')
}


/**
 * @async
 */
ProjectStore.prototype.getPreview = function (key) {
  return this.ipcRenderer.invoke('ipc:get:project/preview', key)
}
