/**
 * @module renderer/store/ProjectStore
 */

import util from 'util'
import { DateTime } from 'luxon'
import uuid from 'uuid-random'
import * as R from 'ramda'
import Emitter from '../../shared/emitter'

/**
 * @typedef {object} Project
 * @property {string} id - `project:${uuid}`
 * @property {string} name - Project name or title.
 * @property {string} lastAccess - ISO date/time.
 */

const split = s =>
  s.replace(/[()-]/gi, ' ')
    .split(' ')
    .filter(R.identity)
    .map(name => name.toLowerCase())

const tokenizeName = project =>
  split(project.name)

const isTag = s => s[0] === '#'
const tags = project =>
  project.tags ? project.tags.map(tag => tag.toLowerCase()) : []

const filterProjects = tokens =>
  tokens.length
    ? projects =>
      projects.filter(project =>
        tokens.every(({ tag, token }) => {
          const xs = tag ? tags(project) : tokenizeName(project)
          return xs.some(x => x.startsWith(token))
        })
      )
    : R.identity


/**
 * @constructor
 * @fires ProjectStore#updated {Project}
 * @fires ProjectStore#created {Project}
 * @fired ProjectStore#deleted {id}
 */
export default function ProjectStore (ipcRenderer) {
  Emitter.call(this)
  this.ipcRenderer = ipcRenderer
}

util.inherits(ProjectStore, Emitter)

ProjectStore.prototype.getProject = async function (id) {
  return this.ipcRenderer.invoke('ipc:get:project', id)
}

/**
 * @async
 */
ProjectStore.prototype.getProjects = async function (filter) {

  // Split filter into tag and name tokens:
  const tokens = (filter || '').split(' ')
    .filter(R.identity)
    .map(token => token.toLowerCase())
    .map(token => ({ tag: isTag(token), token: isTag(token) ? token.substring(1) : token }))
    .filter(({ token }) => token.length)

  const projects = await this.ipcRenderer.invoke('ipc:get:projects')
  projects.sort((a, b) => {
    const nameA = a.name || ''
    const nameB = b.name || ''
    const lastAccessA = a.lastAccess || ''
    const lastAccessB = b.lastAccess || ''
    return nameA.localeCompare(nameB) ||
      lastAccessA.localeCompare(lastAccessB)
  })

  return filterProjects(tokens)(projects)
}


/**
 * @async
 */
ProjectStore.prototype.updateProject = async function (project) {
  await this.ipcRenderer.invoke('ipc:put:project', project)
  this.emit('updated', { project })
}


/**
 * @async
 */
ProjectStore.prototype.createProject = async function (projectUUID = uuid(), projectName = 'New Project', tags = []) {
  const id = `project:${projectUUID}`
  const project = { id, name: projectName, lastAccess: DateTime.local().toISO(), tags }
  await this.ipcRenderer.invoke('ipc:post:project', project)
  this.emit('created', { project })
  this.emit('tagged', { id: projectUUID })
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

/**
 * @async
 * @param {uuid} id Project Id
 * @param {string} tag Whatever the tag shall be
 * @returns The result of the operation
 */
ProjectStore.prototype.addTag = async function (id, tag) {
  await this.ipcRenderer.invoke('ipc:add:project/tag', id, tag)
  this.emit('tagged', { id })
}

/**
 *
 * @async
 * @param {uuid} id Project Id
 * @param {string} tag The tag that should be removed
 * @returns The result of the operation
 */
ProjectStore.prototype.removeTag = async function (id, tag) {
  await this.ipcRenderer.invoke('ipc:remove:project/tag', id, tag)
  this.emit('tagged', { id })
}

/**
 * @async
 */
ProjectStore.prototype.getStreamToken = function (id) {
  return this.ipcRenderer.invoke('ipc:get:replication/streamToken', id)
}

ProjectStore.prototype.putStreamToken = async function (id, streamToken) {
  await this.ipcRenderer.invoke('ipc:put:replication/streamToken', id, streamToken)
}

ProjectStore.prototype.getCredentials = function (id) {
  return this.ipcRenderer.invoke('ipc:get:replication/credentials', id)
}

ProjectStore.prototype.putCredentials = async function (id, credentials) {
  await this.ipcRenderer.invoke('ipc:put:replication/credentials', id, credentials)
}

ProjectStore.prototype.delCredentials = async function (id) {
  await this.ipcRenderer.invoke('ipc:del:replication/credentials', id)
}

ProjectStore.prototype.putReplicationSeed = async function (id, seed) {
  await this.ipcRenderer.invoke('ipc:put:project:replication/seed', id, seed)
}
