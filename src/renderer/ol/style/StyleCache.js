import LRU_TTL from 'lru-ttl-cache'

export function StyleCache () {
  this.store = new LRU_TTL({ max: 500, ttl: 1 * 60 * 1009 })
}

StyleCache.prototype.entry = function (key, factory) {
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
