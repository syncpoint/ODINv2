import { HighLevel } from '../../shared/level/HighLevel'

const BASEMAP = 'basemap:'
const LEGACY = {
  TRANSFERRED: 'legacy:transferred'
}

/**
 * @constructor
 */
export const LegacyStore = function (db) {
  this.db_ = new HighLevel(db)
}

/**
 * Whether or not legacy projects have been transferred.
 */
LegacyStore.prototype.getTransferred = async function () {
  return await this.db_.get(LEGACY.TRANSFERRED, false)
}

/**
 * Copy sources/basemaps to master database.
 */
LegacyStore.prototype.transferSources = function (sources) {
  const entries = Object.entries(sources)
  return this.db_.put(entries)
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

  await this.db_.put(LEGACY.TRANSFERRED, true)
  return this.db_.put(Object.fromEntries(entries))
}

LegacyStore.prototype.getSources = function () {
  return this.db_.entries(BASEMAP)
}
