const { ipcRenderer } = require('electron')

module.exports = {
  getProject: (id) => ipcRenderer.invoke('ipc:get:project', id),
  getProjects: () => ipcRenderer.invoke('ipc:get:projects'),
  getPreview: (id) => ipcRenderer.invoke('ipc:get:project/preview', id),
  updateProject: (project) => ipcRenderer.invoke('ipc:put:project', project),
  createProject: (project) => ipcRenderer.invoke('ipc:post:project', project),
  deleteProject: (id) => ipcRenderer.invoke('ipc:delete:project', id),
  addTag: (id, tag) => ipcRenderer.invoke('ipc:add:project/tag', id, tag),
  removeTag: (id, tag) => ipcRenderer.invoke('ipc:remove:project/tag', id, tag)
}
