import * as R from 'ramda'
import Store from '../../shared/level/Store'

const SESSION = 'session:'
const RECENT = 'recent:'

/**
 * @constructor
 */
function SessionStore (db) {
  this.store_ = new Store(db)
}

SessionStore.prototype.addProject = async function (key) {
  const session = await this.store_.get(SESSION, { projects: [] })
  await this.store_.put(SESSION, {
    ...session,
    projects: R.uniq([...session.projects, key])
  })
}

SessionStore.prototype.removeProject = async function (key) {
  const session = await this.store_.get(SESSION, { projects: [] })
  await this.store_.put(SESSION, {
    ...session,
    projects: session.projects.filter(_key => _key !== key)
  })
}

SessionStore.prototype.getProjects = async function () {
  const session = await this.store_.get(SESSION, { projects: [] })
  const projects = session.projects
  return projects
}

SessionStore.prototype.addRecent = async function (key, name) {
  const recent = await this.store_.get(RECENT, [])
  const update = recent.reverse().filter(({ key: _key }) => _key !== key)
  update.push({ key, name })
  return this.store_.put(RECENT, R.take(7, update.reverse()))
}

SessionStore.prototype.getRecent = async function () {
  return this.store_.get(RECENT, [])
}

SessionStore.prototype.clearRecent = function () {
  return this.store_.put(RECENT, [])
}

export default SessionStore
