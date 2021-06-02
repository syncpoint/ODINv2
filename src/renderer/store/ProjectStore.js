
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
ProjectStore.prototype.updateProject = function (id, project) {
  return this.ipcRenderer.invoke('ipc:put:project', id, project)
}


/**
 * @async
 */
ProjectStore.prototype.createProject = function (id, project) {
  return this.ipcRenderer.invoke('ipc:post:project', id, project)
}


/**
 * @async
 */
ProjectStore.prototype.deleteProject = function (id) {
  return this.ipcRenderer.invoke('ipc:delete:project', id)
}


/**
 * @async
 */
ProjectStore.prototype.getPreview = function (id) {
  return this.ipcRenderer.invoke('ipc:get:project/preview', id)
}
