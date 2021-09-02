import util from 'util'
import * as R from 'ramda'
import { documents } from './documents'
import Emitter from '../../shared/emitter'
import { createIndex } from './MiniSearch-index'


/**
 *
 */
const parseQuery = query => {
  const tokens = (query || '').split(' ')
  return tokens.reduce((acc, token) => {
    if (token.startsWith('@') && token.length > 1) acc.scope.push(token.substring(1))
    else if (token.startsWith('#') && token.length > 1) acc.tags.push(token.substring(1))
    else if (token) acc.text.push(token)
    return acc
  }, { scope: [], text: [], tags: [] })
}


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
    this.index_.remove(this.cache_[op.key])
    this.cache_[op.key] = documents[scope](op.value, cache)
    this.index_.add(this.cache_[op.key])
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

  const options = field => ({ fields: [field], prefix: true, combineWith: 'AND' })
  const searchIndex = field => {
    const matches = this.index_.search(tokens[field].join(' '), options(field))
    return matches.map(R.prop('id'))
  }
  const intersection = () => {
    const A = searchIndex('text')
    const B = searchIndex('tags')
    return A.length ? B.length ? R.intersection(A, B) : A : B
  }

  const ids = (tokens.text.length || tokens.tags.length)
    ? intersection()
    : Object.keys(this.carrera_)

  return ids.map(id => this.carrera_[id]).filter(filter)
}
