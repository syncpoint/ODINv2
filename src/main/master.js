import Store from '../shared/level/Store'

const BASEMAP = 'basemap:'
const LEGACY = {
  TRANSFERRED: 'legacy:transferred'
}
const PROJECT = 'project:'
const SESSION = 'session:'


const Master = function (db) {
  this._store = new Store(db)
}

Master.prototype.close = function () {
  return this._store.close()
}

/**
 * Whether or not legacy projects have been transferred.
 */
Master.prototype.getTransferred = async function () {
  return await this._store.get(LEGACY.TRANSFERRED, false)
}

/**
 * Copy sources/basemaps to master database.
 */
Master.prototype.transferSources = function (sources) {
  const entries = Object.entries(sources)
  return this._store.put(entries)
}


/**
 * Copy projects metadata to master database.
 */
Master.prototype.transferMetadata = async function (projects) {
  const entries = Object.entries(projects).map(([id, project]) => {
    return [id, {
      ...project.metadata,
      viewport: project.preferences.viewport
    }]
  })
  await this._store.put(LEGACY.TRANSFERRED, true)
  return this._store.put(Object.fromEntries(entries))
}

Master.prototype.getSources = function () {
  return this._store.entries(BASEMAP)
}

Master.prototype.getProjects = function () {
  return this._store.list(PROJECT)
}

Master.prototype.getProject = async function (key) {
  return { key, ...await this._store.get(key) }
}

Master.prototype.getSession = function () {
  return this._store.get(SESSION, {
    projects: []
  })
}

Master.prototype.putSession = function (session) {
  console.log('[Master]', session)
  this._store.put(SESSION, session)
}

Master.prototype.putWindowBounds = function (key, bounds) {
  return this._store.assign(key, { bounds })
}

export default Master
