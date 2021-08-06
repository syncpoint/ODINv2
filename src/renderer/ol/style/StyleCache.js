import LRU_TTL from 'lru-ttl-cache'

export function StyleCache () {
  this.store = new LRU_TTL({ max: 1000, ttl: 10 * 60 * 1000 })
}

StyleCache.prototype.entry = function (key, factory) {
  if (!key) return
  const entry = this.store.get(key)

  // if (entry) console.log('[CACHE] hit', key)
  // else console.log('[CACHE] miss', key)

  if (entry) return entry
  else {
    const entry = factory()
    this.store.set(key, entry)
    return entry
  }
}

StyleCache.prototype.clear = function () {
  this.store.clearAll()
}
