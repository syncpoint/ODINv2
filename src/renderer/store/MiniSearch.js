import util from 'util'
import * as R from 'ramda'
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
 *
 */
MiniSearchIndex.prototype.document_ = function (entry, cache) {
  if (!entry.id) return null
  const scope = entry.id.split(':')[0]
  const fn = documents[scope]
  if (!fn) return null
  return fn(entry, cache)
}


/**
 * Create initial index (one time only).
 */
MiniSearchIndex.prototype.createIndex_ = function () {
  const entries = Object.values(this.carrera_)
  const cache = id => this.carrera_[id]
  const docs = entries
    .map(entry => this.document_(entry, cache))
    .filter(R.identity)

  docs.forEach(doc => (this.cache_[doc.id] = doc))
  this.index_.addAll(docs)

  this.ready_ = true
  this.emit('ready')
}


/**
 * Update index based on store batch operations.
 */
MiniSearchIndex.prototype.handleBatch = function (ops) {
  const excludes = ['locked', 'hidden']
  const candidates = ops.filter(({ key }) => !excludes.includes(key.split('+')[0]))

  const cache = id => this.carrera_[id]
  const updates = candidates.filter(op => op.type === 'put')
  const removals = candidates.filter(op => op.type === 'del')

  for (const op of updates) {
    const cachedDocument = this.cache_[op.key]
    if (cachedDocument) this.index_.remove(cachedDocument)
    const document = this.document_(op.value, cache)
    if (!document) return

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
      const prefixes = prefix.split('|')
      return item => prefixes.some(prefix => item[property] && item[property].startsWith(prefix))
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

  return R.uniq(ids).map(id => this.carrera_[id]).filter(filter)
}
