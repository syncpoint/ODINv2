import Store from '../../shared/level/Store'

export function SessionStore (db, key) {
  this._store = new Store(db)
  this._key = key
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
  return this._store.assign(this._key, { viewport })
}

SessionStore.prototype.getViewport = async function (defaultViewport) {
  const metadata = await this._store.get(this._key)
  const viewport = metadata.viewport || defaultViewport
  return viewport
}
