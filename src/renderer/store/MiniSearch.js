import util from 'util'
import MiniSearch from 'minisearch'
import * as R from 'ramda'
import { documents } from './documents'
import Emitter from '../../shared/emitter'
import { options as createOption } from '../model/options'


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

  this.index_ = new MiniSearch({
    fields: ['text', 'tags'],
    tokenize: string => string.split(/[ ()]+/),
    extractField: (document, fieldName) => {
      const value = document[fieldName]
      return value && fieldName === 'tags'
        ? value.flat().filter(R.identity).join(' ')
        : value
    }
  })

  this.ready_ = false
}

util.inherits(MiniSearchIndex, Emitter)


/**
 * Create initial index (one time only).
 */
MiniSearchIndex.prototype.createIndex_ = function () {
  const entries = Object.values(this.carrera_)

  const cache = id => this.carrera_[id]
  const docs = entries.reduce((acc, entry) => {
    const scope = entry.id.split(':')[0]
    const doc = documents[scope](entry, cache)
    acc.push(doc)
    return acc
  }, [])

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
  const searchIndex = field => this.index_.search(tokens[field].join(' '), options(field)).map(R.prop('id'))
  const intersection = () => {
    const A = searchIndex('text')
    const B = searchIndex('tags')
    return A.length ? B.length ? R.intersection(A, B) : A : B
  }

  const ids = (tokens.text.length || tokens.tags.length)
    ? intersection()
    : Object.keys(this.carrera_)

  const cache = id => this.carrera_[id]
  return ids.reduce((acc, id) => {
    const item = this.carrera_[id]
    if (filter(item)) acc.push(createOption[item.id.split(':')[0]](item, cache))
    return acc
  }, [])
}


// /**
//  *
//  */
// MiniSearchIndex.prototype.searchScope_ = function (scope) {
//   const task = uuid()
//   logger.log(`[MiniSearchIndex/search:${task}/1]`)
//   logger.time(`[MiniSearchIndex/search:${task}/1]`)



//   const items = Object.values(this.mirror_)
//     .filter(item => item.id.startsWith(scope))
//   logger.log(`[MiniSearchIndex/search:${task}/1]: items`, items.length)
//   const cache = id => this.mirror_[id]
//   const result = items.reduce((acc, item) => {
//     const option = options[item.id.split(':')[0]](item, cache)
//     acc.push(option)
//     // logger.log(`[MiniSearchIndex/search:${task}/1]: progress`, acc.length, 'of', items.length)
//     return acc
//   }, [])

//   logger.timeEnd(`[MiniSearchIndex/search:${task}/1]`)
//   return result
// }


// /**
//  *
//  */
// MiniSearchIndex.prototype.searchFiltered_ = function (terms) {
//   const task = uuid()
//   logger.log(`[MiniSearchIndex/search:${task}/2]`)
//   logger.time(`[MiniSearchIndex/search:${task}/2]`)

//   const { scope, text, tags } = terms
//   const filter = scope
//     ? result => result.id.startsWith(scope)
//     : () => true

//   const A = this.index_.search(text.join(' '), { fields: ['text'], prefix: true, filter, combineWith: 'AND' })
//   const B = this.index_.search(tags.join(' '), { fields: ['tags'], prefix: true, filter, combineWith: 'AND' })

//   // Intersect result A with B.
//   const set =

//   logger.log(`[MiniSearchIndex/search:${task}/2] hits`, set.length)
//   const cache = id => this.mirror_[id]
//   const result = set.reduce((acc, id) => {
//     const item = cache(id)
//     const option = options[item.id.split(':')[0]](item, cache)
//     acc.push(option)
//     return acc
//   }, [])

//   logger.timeEnd(`[MiniSearchIndex/search:${task}/2]`)
//   return result
// }
