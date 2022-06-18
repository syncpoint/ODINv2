import * as L from '../../shared/level'

const BASEMAP = 'basemap:'
const LEGACY = {
  TRANSFERRED: 'legacy:transferred'
}

/**
 * @constructor
 */
export const LegacyStore = function (db) {
  this.db = db
}

/**
 * Whether or not legacy projects have been transferred.
 */
LegacyStore.prototype.getTransferred = async function () {
  return await L.get(this.db, LEGACY.TRANSFERRED, false)
}

/**
 * Copy sources/basemaps to master database.
 */
LegacyStore.prototype.transferSources = async function (sources) {
  await L.mput(this.db, sources)
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

  await this.db.put(LEGACY.TRANSFERRED, true)
  return L.mput(this.db, entries)
}

LegacyStore.prototype.getSources = async function () {
  const tuples = await L.tuples(this.db, BASEMAP)
  return Object.fromEntries(tuples)
}
