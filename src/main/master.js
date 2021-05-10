import Store from '../shared/Store'

const BASEMAP = 'basemap:'
const PROJECT = 'project:'
const LEGACY = {
  TRANSFERRED: 'legacy:transferred'
}



const Master = function (db) {
  this.store = new Store(db)
}

Master.prototype.close = function () {
  return this.store.close()
}

/**
 * Whether or not legacy projects have been transferred.
 */
Master.prototype.getTransferred = async function () {
  return await this.store.get(LEGACY.TRANSFERRED, false)
}

/**
 * Copy sources/basemaps to master database.
 */
Master.prototype.transferSources = function (sources) {
  const entries = Object.entries(sources)
  return this.store.put(entries)
}


/**
 * Copy projects metadata to master database.
 */
Master.prototype.transferMetadata = async function (projects) {
  const entries = Object.entries(projects).map(([id, project]) => [id, project.metadata])
  await this.store.put(LEGACY.TRANSFERRED, true)
  return this.store.put(Object.fromEntries(entries))
}

Master.prototype.getSources = function () {
  return this.store.entries(BASEMAP)
}

Master.prototype.getProjects = function () {
  return this.store.entries(PROJECT)
}

export default Master
