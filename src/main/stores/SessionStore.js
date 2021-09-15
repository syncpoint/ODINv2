import * as R from 'ramda'
import { HighLevel } from '../../shared/level/HighLevel'

const SESSION = 'session:'
const RECENT = 'recent:'

/**
 * @constructor
 */
export const SessionStore = function (db) {
  this.db_ = new HighLevel(db)
}

SessionStore.prototype.addProject = async function (key) {
  const session = await this.db_.get(SESSION, { projects: [] })
  await this.db_.put(SESSION, {
    ...session,
    projects: R.uniq([...session.projects, key])
  })
}

SessionStore.prototype.removeProject = async function (key) {
  const session = await this.db_.get(SESSION, { projects: [] })
  await this.db_.put(SESSION, {
    ...session,
    projects: session.projects.filter(_key => _key !== key)
  })
}

SessionStore.prototype.getProjects = async function () {
  const session = await this.db_.get(SESSION, { projects: [] })
  const projects = session.projects
  return projects
}

SessionStore.prototype.addRecent = async function (key, name) {
  const recent = await this.db_.get(RECENT, [])
  const update = recent.reverse().filter(({ key: _key }) => _key !== key)
  update.push({ key, name })
  return this.db_.put(RECENT, R.take(7, update.reverse()))
}

SessionStore.prototype.getRecent = async function () {
  return this.db_.get(RECENT, [])
}

SessionStore.prototype.clearRecent = function () {
  return this.db_.put(RECENT, [])
}
