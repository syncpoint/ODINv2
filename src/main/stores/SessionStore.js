import * as R from 'ramda'

const SESSION = 'session:'
const RECENT = 'recent:'

/**
 * @constructor
 */
export const SessionStore = function (db) {
  this.db = db
}

SessionStore.prototype.addProject = async function (key) {
  const projects = session => R.uniq([...session.projects || [], key])
  const session = await this.db.get(SESSION, { projects: [] })
  await this.db.put(SESSION, { ...session, projects: projects(session) })
}

SessionStore.prototype.removeProject = async function (key) {
  const projects = session => (session.projects || []).filter(x => x !== key)
  const session = await this.db.get(SESSION, { projects: [] })
  await this.db.put(SESSION, { ...session, projects: projects(session) })
}

SessionStore.prototype.getProjects = async function () {
  const { projects } = await this.db.get(SESSION, { projects: [] })
  return projects
}

SessionStore.prototype.addRecent = async function (key, name) {
  const recent = await this.db.get(RECENT, [])
  const update = recent.reverse().filter(({ key: x }) => x !== key)
  update.push({ key, name })
  return this.db.put(RECENT, R.take(7, update.reverse()))
}

SessionStore.prototype.getRecent = async function () {
  return this.db.get(RECENT, [])
}

SessionStore.prototype.clearRecent = function () {
  return this.db.put(RECENT, [])
}
