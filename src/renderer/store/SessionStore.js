import { HighLevel } from '../../shared/level/HighLevel'

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

SessionStore.prototype.getViewport = async function (defaultViewport) {
  const metadata = await this.db_.get(this.key_)
  const viewport = metadata.viewport || defaultViewport
  return viewport
}
