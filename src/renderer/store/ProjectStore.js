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
      projects.filter(([_, project]) =>
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
export function ProjectStore (ipcRenderer) {
  Emitter.call(this)
  this.ipcRenderer = ipcRenderer
}

util.inherits(ProjectStore, Emitter)


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
  console.log('projectStore', projects)
  projects.sort((a, b) =>
    a.name.localeCompare(b.name) ||
    a.lastAccess.localeCompare(b.lastAccess)
  )

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
ProjectStore.prototype.createProject = async function () {
  const id = `project:${uuid()}`
  const project = { id, name: 'New Project', lastAccess: DateTime.local().toISO() }
  await this.ipcRenderer.invoke('ipc:post:project', project)
  this.emit('created', { project })
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
