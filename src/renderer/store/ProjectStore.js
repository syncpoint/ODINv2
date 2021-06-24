import util from 'util'
import * as R from 'ramda'
import { DateTime } from 'luxon'
import uuid from 'uuid-random'
import Emitter from '../../shared/emitter'

/*
 * @constructor
 * @fires updated
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
  this.emit('updated', { id, project })
}


/**
 * @async
 */
ProjectStore.prototype.archiveProject = async function (id, project) {
  const tags = project.tags ? R.uniq([...project.tags, 'DELETED']) : ['DELETED']
  await this.ipcRenderer.invoke('ipc:put:project', id, { ...project, tags })
  this.emit('archived', { id })
}


/**
 * @async
 */
ProjectStore.prototype.createProject = async function () {
  const id = `project:${uuid()}`
  const project = { name: 'New Project', lastAccess: DateTime.local().toISO() }
  await this.ipcRenderer.invoke('ipc:post:project', id, project)
  this.emit('created', { id, project })
}


/**
 * @async
 */
ProjectStore.prototype.deleteProject = async function (id) {
  await this.ipcRenderer.invoke('ipc:delete:project', id)
  this.emit('deleted', { id })
}


/**
 * @async
 */
ProjectStore.prototype.getPreview = function (id) {
  return this.ipcRenderer.invoke('ipc:get:project/preview', id)
}
