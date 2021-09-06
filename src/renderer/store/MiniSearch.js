import util from 'util'
import { documents } from './documents'
import Emitter from '../../shared/emitter'
import { createIndex, parseQuery, searchIndex } from './MiniSearch-index'


/**
 * @constructor
 * @fires ready
 * @fires index/updated
 */
export function MiniSearchIndex (carrera) {
  Emitter.call(this)

  // Cache indexed documents for removal.
  this.cache_ = {}
  this.carrera_ = carrera

  this.index_ = createIndex()
  this.ready_ = false
}

util.inherits(MiniSearchIndex, Emitter)


/**
 * Create initial index (one time only).
 */
MiniSearchIndex.prototype.createIndex_ = function () {
  const entries = Object.values(this.carrera_)

  const cache = id => this.carrera_[id]
  const docs = entries.map(entry => {
    const scope = entry.id.split(':')[0]
    return documents[scope](entry, cache)
  })

  docs.forEach(doc => (this.cache_[doc.id] = doc))
  this.index_.addAll(docs)

  this.ready_ = true
  this.emit('ready')
}


/**
 * Update index based on store batch operations.
 */
MiniSearchIndex.prototype.handleBatch = function (ops) {
  const cache = id => this.carrera_[id]
  const updates = ops.filter(op => op.type === 'put')
  const removals = ops.filter(op => op.type === 'del')

  for (const op of updates) {
    const scope = op.key.split(':')[0]
    const cachedDocument = this.cache_[op.key]
    if (cachedDocument) this.index_.remove(cachedDocument)
    const document = documents[scope](op.value, cache)
    this.cache_[op.key] = document
    this.index_.add(document)
  }

  for (const op of removals) {
    this.index_.remove(this.cache_[op.key])
    delete this.cache_[op.key]
  }
}


/**
 *
 */
MiniSearchIndex.prototype.ready = function () {
  return this.ready_
}


/**
 * search :: string -> Promise([option])
 */
MiniSearchIndex.prototype.search = function (query) {
  const tokens = parseQuery(query)

  const split = s => {
    const index = s.indexOf(':')
    return [s.substring(0, index), s.substring(index + 1)]
  }

  const scopeFilter = scope => {
    const conditions = scope.map(scope => {
      const [property, prefix] = split(scope)
      return item => item[property] && item[property].startsWith(prefix)
    })

    // All conditions must hold.
    return item => conditions.every(condition => condition(item))
  }

  const filter = tokens.scope.length
    ? scopeFilter(tokens.scope)
    : () => true

  const ids = (tokens.text.length || tokens.tags.length)
    ? searchIndex(this.index_, tokens)
    : Object.keys(this.carrera_)

  return ids.map(id => this.carrera_[id]).filter(filter)
}
