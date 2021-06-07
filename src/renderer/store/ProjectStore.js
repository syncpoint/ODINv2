import util from 'util'
import * as R from 'ramda'
import { DateTime } from 'luxon'
import uuid from 'uuid-random'
import Emitter from '../../shared/emitter'

/**
 * @constructor
 * @fires projects/updated
 */
export function ProjectStore (ipcRenderer) {
  Emitter.call(this)
  this.ipcRenderer = ipcRenderer
}

util.inherits(ProjectStore, Emitter)


ProjectStore.prototype.includesTag = (project, tag) => {
  const tags = project.tags || []
  return tags.includes(tag.toUpperCase())
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
ProjectStore.prototype.updateProject = async function (id, project) {
  await this.ipcRenderer.invoke('ipc:put:project', id, project)
  const projects = await this.getProjects()
  this.emit('projects/updated', { projects })
}


/**
 * @async
 */
ProjectStore.prototype.addTag = async function (id, project, tag) {
  const tags = project.tags || []
  return this.updateProject(id, {
    ...project,
    tags: R.uniq([...tags, tag.toUpperCase()])
  })
}


/**
 * @async
 */
ProjectStore.prototype.createProject = async function () {
  const id = `project:${uuid()}`
  const project = { name: 'New Project', lastAccess: DateTime.local().toISO() }
  await this.ipcRenderer.invoke('ipc:post:project', id, project)
  const projects = await this.getProjects()
  this.emit('projects/updated', { projects })
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
