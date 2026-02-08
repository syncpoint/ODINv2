/**
 * @module renderer/store/ProjectStore
 */

import util from 'util'
import { DateTime } from 'luxon'
import uuid from '../../shared/uuid'
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
export default function ProjectStore (projects, replication) {
  Emitter.call(this)
  this.projects = projects
  this.replication = replication
}

util.inherits(ProjectStore, Emitter)

ProjectStore.prototype.getProject = async function (id) {
  return this.projects.getProject(id)
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

  const projects = await this.projects.getProjects()
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
  await this.projects.updateProject(project)
  this.emit('updated', { project })
}


/**
 * @async
 */
ProjectStore.prototype.createProject = async function (projectUUID = uuid(), projectName = 'New Project', tags = []) {
  const id = `project:${projectUUID}`
  const project = { id, name: projectName, lastAccess: DateTime.local().toISO(), tags }
  await this.projects.createProject(project)
  this.emit('created', { project })
  this.emit('tagged', { id: projectUUID })
}


/**
 * @async
 */
ProjectStore.prototype.deleteProject = async function (id) {
  await this.projects.deleteProject(id)
  this.emit('deleted', { id })
}


/**
 * @async
 */
ProjectStore.prototype.getPreview = function (id) {
  return this.projects.getPreview(id)
}

/**
 * @async
 * @param {uuid} id Project Id
 * @param {string} tag Whatever the tag shall be
 * @returns The result of the operation
 */
ProjectStore.prototype.addTag = async function (id, tag) {
  await this.projects.addTag(id, tag)
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
  await this.projects.removeTag(id, tag)
  this.emit('tagged', { id })
}

/**
 * @async
 */
ProjectStore.prototype.getStreamToken = async function (id) {
  return this.replication.getStreamToken(id)
}

ProjectStore.prototype.putStreamToken = async function (id, streamToken) {
  return this.replication.putStreamToken(id, streamToken)
}

ProjectStore.prototype.getCredentials = function (id) {
  return this.replication.getCredentials(id)
}

ProjectStore.prototype.putCredentials = async function (id, credentials) {
  return this.replication.putCredentials(id, credentials)
}

ProjectStore.prototype.delCredentials = async function (id) {
  return this.replication.delCredentials(id)
}

ProjectStore.prototype.putReplicationSeed = async function (id, seed) {
  return this.replication.putReplicationSeed(id, seed)
}
