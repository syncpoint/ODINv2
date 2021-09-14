import Store from '../../shared/level/Store'

const BASEMAP = 'basemap:'
const LEGACY = {
  TRANSFERRED: 'legacy:transferred'
}

/**
 * @constructor
 */
function LegacyStore (db) {
  this.store_ = new Store(db)
}

/**
 * Whether or not legacy projects have been transferred.
 */
LegacyStore.prototype.getTransferred = async function () {
  return await this.store_.get(LEGACY.TRANSFERRED, false)
}

/**
 * Copy sources/basemaps to master database.
 */
LegacyStore.prototype.transferSources = function (sources) {
  const entries = Object.entries(sources)
  return this.store_.put(entries)
}


/**
 * Copy projects metadata to master database.
 */
LegacyStore.prototype.transferMetadata = async function (projects) {
  const entries = projects.map(project => {
    return [project.id, {
      id: project.id,
      ...project.metadata,
      viewport: project.preferences.viewport
    }]
  })

  await this.store_.put(LEGACY.TRANSFERRED, true)
  return this.store_.put(Object.fromEntries(entries))
}

LegacyStore.prototype.getSources = function () {
  return this.store_.entries(BASEMAP)
}

export default LegacyStore
