import LRU_TTL from 'lru-ttl-cache'

export function StyleCache () {
  this.store_ = new LRU_TTL({ max: 1000, ttl: 10 * 60 * 1000 })
}


/**
 *
 */
StyleCache.prototype.entry = function (key, factory) {
  if (!key) return
  const entry = this.store_.get(key)

  // if (entry) console.log('[CACHE] hit', key)
  // else console.log('[CACHE] miss', key)

  if (entry) return entry
  else {
    const entry = factory()
    this.store_.set(key, entry)
    return entry
  }
}


/**
 *
 */
StyleCache.prototype.removePartial = function (partial) {
  const acc = []
  for (const key of this.store_.keys()) {
    if (key.includes(partial)) acc.push(key)
  }

  acc.forEach(key => this.store_.delete(key))
}


/**
 *
 */
StyleCache.prototype.clear = function () {
  this.store_.clearAll()
}
