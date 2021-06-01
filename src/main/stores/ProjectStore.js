import Store from '../../shared/level/Store'

const PROJECT = 'project:'
const PREVIEW = key => `preview:${key}`

/**
 * @constructor
 */
function ProjectStore (db, ipcMain) {
  this.store = new Store(db)

  ipcMain.handle('ipc:get:projects', () => {
    return this.getProjects()
  })

  ipcMain.handle('ipc:get:project/preview', (_, key) => {
    return this.getPreview(key)
  })
}

ProjectStore.prototype.getProjects = function () {
  return this.store.list(PROJECT)
}

ProjectStore.prototype.getProject = function (key) {
  return this.store.get(key)
}

ProjectStore.prototype.updateWindowBounds = function (key, bounds) {
  return this.store.assign(key, { bounds })
}

ProjectStore.prototype.putPreview = function (key, dataURL) {
  return this.store.put(PREVIEW(key), dataURL)
}

ProjectStore.prototype.getPreview = function (key) {
  return this.store.get(PREVIEW(key), null)
}

export default ProjectStore
