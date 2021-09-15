import * as R from 'ramda'
import { HighLevel } from '../../shared/level/HighLevel'

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
export const ProjectStore = function (db) {
  this.db_ = new HighLevel(db)
}

ProjectStore.prototype.getProjects = function () {
  return this.db_.values('project:')
}

ProjectStore.prototype.getProject = function (id) {
  return this.db_.get(id)
}

ProjectStore.prototype.putProject = function (project) {
  return this.db_.put(project.id, project)
}

ProjectStore.prototype.deleteProject = function (id) {
  return this.db_.del(id)
}

ProjectStore.prototype.updateWindowBounds = function (id, bounds) {
  return this.db_.assign(id, { bounds })
}

ProjectStore.prototype.addTag = async function (id, tag) {
  const project = await this.db_.get(id)
  return this.db_.put(id, {
    ...project,
    tags: R.uniq([...(project.tags || []), tag.toUpperCase()])
  })
}

ProjectStore.prototype.removeTag = async function (id, tag) {

  // FIXME: On shutdown, might run into ReadError: Database is not open.

  const project = await this.db_.get(id)
  return this.db_.put(id, {
    ...project,
    tags: (project.tags || []).filter(tag_ => tag_ !== tag.toUpperCase())
  })
}

ProjectStore.prototype.putPreview = function (id, dataURL) {
  return this.db_.put(PREVIEW(id), dataURL)
}

ProjectStore.prototype.getPreview = function (id) {
  return this.db_.get(PREVIEW(id), null)
}
