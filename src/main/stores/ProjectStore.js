import Store from '../../shared/level/Store'

const PROJECT = 'project:'
const PREVIEW = key => `preview:${key}`

/**
 * @constructor
 */
function ProjectStore (db) {
  this.store = new Store(db)
}

ProjectStore.prototype.getProjects = function () {
  return this.store.list(PROJECT)
}

ProjectStore.prototype.getProject = function (id) {
  return this.store.get(id)
}

ProjectStore.prototype.putProject = function (id, value) {
  return this.store.put(id, value)
}

ProjectStore.prototype.deleteProject = function (id) {
  return this.store.del(id)
}

ProjectStore.prototype.updateWindowBounds = function (id, bounds) {
  return this.store.assign(id, { bounds })
}

ProjectStore.prototype.putPreview = function (id, dataURL) {
  return this.store.put(PREVIEW(id), dataURL)
}

ProjectStore.prototype.getPreview = function (id) {
  return this.store.get(PREVIEW(id), null)
}

export default ProjectStore
