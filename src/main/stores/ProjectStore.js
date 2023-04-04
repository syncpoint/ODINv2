import * as R from 'ramda'
import * as L from '../../shared/level'

const PROJECT = 'project:'
const PREVIEW = key => `preview:${key}`
const STREAM_TOKEN = key => `streamToken:${key}`
const CREDENTIALS = key => `credentials:${key}`

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
  this.db = db
}

ProjectStore.prototype.getProjects = function () {
  return L.values(this.db, PROJECT)
}

ProjectStore.prototype.getProject = function (id) {
  return this.db.get(id)
}

ProjectStore.prototype.putProject = function (project) {
  return this.db.put(project.id, project)
}

ProjectStore.prototype.deleteProject = function (id) {
  return this.db.del(id)
}

ProjectStore.prototype.updateWindowBounds = function (id, bounds) {
  return L.tap(this.db, id, project => ({ ...project, bounds }))
}

ProjectStore.prototype.addTag = async function (id, tag) {
  const tags = project => R.uniq([...(project.tags || []), tag.toUpperCase()])
  return L.tap(this.db, id, project => ({ ...project, tags: tags(project) }))
}

ProjectStore.prototype.removeTag = async function (id, tag) {
  // FIXME: On shutdown, might run into ReadError: Database is not open.
  const tags = project => (project.tags || []).filter(x => x !== tag.toUpperCase())
  await L.tap(this.db, id, project => ({ ...project, tags: tags(project) }))
}

ProjectStore.prototype.putPreview = function (id, dataURL) {
  return this.db.put(PREVIEW(id), dataURL)
}

ProjectStore.prototype.getPreview = function (id) {
  return L.get(this.db, PREVIEW(id), null)
}

ProjectStore.prototype.getStreamToken = function (id) {
  return L.get(this.db, STREAM_TOKEN(id), null)
}

ProjectStore.prototype.putStreamToken = function (id, streamToken) {
  return this.db.put(STREAM_TOKEN(id), streamToken)
}

ProjectStore.prototype.getCredentials = function (id) {
  return L.get(this.db, CREDENTIALS(id), null)
}

ProjectStore.prototype.putCredentials = function (id, credentials) {
  return this.db.put(CREDENTIALS(id), credentials)
}

ProjectStore.prototype.delCredentials = function (id) {
  return this.db.del(CREDENTIALS(id))
}
