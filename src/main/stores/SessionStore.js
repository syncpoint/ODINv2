import * as R from 'ramda'
import Store from '../../shared/level/Store'

const SESSION = 'session:'

export function SessionStore (db) {
  this.store = new Store(db)
}

SessionStore.prototype.addProject = async function (key) {
  const session = await this.store.get(SESSION, { projects: [] })
  await this.store.put(SESSION, {
    ...session,
    projects: R.uniq([...session.projects, key])
  })
}

SessionStore.prototype.removeProject = async function (key) {
  const session = await this.store.get(SESSION, { projects: [] })
  await this.store.put(SESSION, {
    ...session,
    projects: session.projects.filter(_key => _key !== key)
  })
}

SessionStore.prototype.getProjects = async function () {
  const session = await this.store.get(SESSION, { projects: [] })
  return R.uniq(session.projects)
}
