import Store from '../../shared/level/Store'

const PROJECT = 'project:'

export function ProjectStore (db) {
  this.store = new Store(db)
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
