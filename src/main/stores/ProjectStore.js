import * as R from 'ramda'
import Store from '../../shared/level/Store'

const PREVIEW = key => `preview:${key}`

/**
 * @typedef {object} Project
 * @property {string} id - `project:${uuid}`
 * @property {string} name - Project name or title.
 * @property {string} lastAccess - ISO date/time.
 */

/**
 * @constructor
 */
function ProjectStore (db) {
  this.store = new Store(db)
}

ProjectStore.prototype.getProjects = function () {
  return this.store.values('project:')
}

ProjectStore.prototype.getProject = function (id) {
  return this.store.get(id)
}

ProjectStore.prototype.putProject = function (project) {
  return this.store.put(project.id, project)
}

ProjectStore.prototype.deleteProject = function (id) {
  return this.store.del(id)
}

ProjectStore.prototype.updateWindowBounds = function (id, bounds) {
  return this.store.assign(id, { bounds })
}

ProjectStore.prototype.addTag = async function (id, tag) {
  const project = await this.store.get(id)
  return this.store.put(id, {
    ...project,
    tags: R.uniq([...(project.tags || []), tag.toUpperCase()])
  })
}

ProjectStore.prototype.removeTag = async function (id, tag) {
  const project = await this.store.get(id)
  return this.store.put(id, {
    ...project,
    tags: (project.tags || []).filter(tag_ => tag_ !== tag.toUpperCase())
  })
}

ProjectStore.prototype.putPreview = function (id, dataURL) {
  return this.store.put(PREVIEW(id), dataURL)
}

ProjectStore.prototype.getPreview = function (id) {
  return this.store.get(PREVIEW(id), null)
}

export default ProjectStore
