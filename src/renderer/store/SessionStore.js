import * as L from '../../shared/level'

const DEFAULT_VIEWPORT = {
  center: [1823376.75753279, 6143598.472197734], // Vienna
  resolution: 612,
  rotation: 0
}

export function SessionStore (db, key) {
  this.db = db
  this.key = key
}

/**
 * viewport: {
 *   center: [longitude, latitude] WebMercator,
 *   resolution: Number,
 *   zoom: Number (optional, instead of resolution),
 *   rotation: Number (optional, radians)
 * }
 */
SessionStore.prototype.putViewport = async function (viewport) {
  return L.tap(this.db, this.key, value => ({ ...value, viewport }))
}

SessionStore.prototype.getViewport = async function () {
  const metadata = await this.db.get(this.key)
  return metadata.viewport || DEFAULT_VIEWPORT
}
