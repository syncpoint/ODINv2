import { HighLevel } from '../../shared/level/HighLevel'

const DEFAULT_VIEWPORT = {
  center: [1823376.75753279, 6143598.472197734], // Vienna
  resolution: 612,
  rotation: 0
}

export function SessionStore (db, key) {
  this.db_ = new HighLevel(db)
  this.key_ = key
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
  return this.db_.assign(this.key_, { viewport })
}

SessionStore.prototype.getViewport = async function () {
  const metadata = await this.db_.get(this.key_)
  const viewport = metadata.viewport || DEFAULT_VIEWPORT
  return viewport
}
