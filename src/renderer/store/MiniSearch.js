import util from 'util'
import MiniSearch from 'minisearch'
import * as R from 'ramda'
import uuid from 'uuid-random'
import { documents } from './documents'
import Emitter from '../../shared/emitter'
import { options } from '../model/options'
import { parseQuery } from './index-common'

const logger = console
// const logger = {
//   log: () => {},
//   time: () => {},
//   timeEnd: () => {}
// }

/**
 * @constructor
 * @fires ready
 * @fires index/updated
 */
export function MiniSearchIndex (mirror) {
  Emitter.call(this)

  // Cache indexed documents for removal.
  this.cache_ = {}
  this.mirror_ = mirror

  this.index_ = new MiniSearch({
    fields: ['text', 'tags'],
    storeFields: ['text', 'tags'],
    tokenize: string => string.split(/[ ()]+/),
    extractField: (document, fieldName) => {
      const value = document[fieldName]
      if (value && fieldName === 'tags') return value.flat().filter(R.identity).join(' ')
      else return value
    }
  })

  this.ready_ = false
}

util.inherits(MiniSearchIndex, Emitter)


/**
 * Create initial index (one time only).
 */
MiniSearchIndex.prototype.createIndex_ = function () {
  logger.log('[MiniSearchIndex/createIndex_]')
  logger.time('[MiniSearchIndex/createIndex_]')
  const entries = Object.values(this.mirror_)

  logger.log('[MiniSearchIndex/createIndex_] entries', entries.length)
  const cache = id => this.mirror_[id]
  const docs = entries.reduce((acc, entry) => {
    const scope = entry.id.split(':')[0]
    const doc = documents[scope](entry, cache)
    acc.push(doc)
    // logger.log('[MiniSearchIndex/createIndex_] progress', acc.length, 'of', entries.length)
    return acc
  }, [])

  docs.forEach(doc => (this.cache_[doc.id] = doc))
  this.index_.addAll(docs)
  logger.timeEnd('[MiniSearchIndex/createIndex_]')

  this.ready_ = true
  this.emit('ready')
}


/**
 * Update index based on store batch operations.
 */
MiniSearchIndex.prototype.handleBatch = function (ops) {
  logger.log('[MiniSearchIndex/handleBatch]')
  logger.time('[MiniSearchIndex/handleBatch]')
  const cache = id => this.mirror_[id]
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

  logger.timeEnd('[MiniSearchIndex/handleBatch]')
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
  const terms = parseQuery(query)
  const { scope, text, tags } = terms
  if (!text.length && !tags.length) return this.searchScope_(scope)
  else return this.searchFiltered_(terms)
}


/**
 *
 */
MiniSearchIndex.prototype.searchScope_ = function (scope) {
  const task = uuid()
  logger.log(`[MiniSearchIndex/search:${task}/1]`)
  logger.time(`[MiniSearchIndex/search:${task}/1]`)
  const items = Object.values(this.mirror_)
    .filter(item => item.id.startsWith(scope))
  logger.log(`[MiniSearchIndex/search:${task}/1]: items`, items.length)
  const cache = id => this.mirror_[id]
  const result = items.reduce((acc, item) => {
    const option = options[item.id.split(':')[0]](item, cache)
    acc.push(option)
    // logger.log(`[MiniSearchIndex/search:${task}/1]: progress`, acc.length, 'of', items.length)
    return acc
  }, [])

  logger.timeEnd(`[MiniSearchIndex/search:${task}/1]`)
  return result
}


/**
 *
 */
MiniSearchIndex.prototype.searchFiltered_ = function (terms) {
  const task = uuid()
  logger.log(`[MiniSearchIndex/search:${task}/2]`)
  logger.time(`[MiniSearchIndex/search:${task}/2]`)

  const { scope, text, tags } = terms
  const filter = scope
    ? result => result.id.startsWith(scope)
    : () => true

  const A = this.index_.search(text.join(' '), { fields: ['text'], prefix: true, filter, combineWith: 'AND' })
  const B = this.index_.search(tags.join(' '), { fields: ['tags'], prefix: true, filter, combineWith: 'AND' })

  // Intersect result A with B.
  const set = A.length
    ? B.length
      ? R.intersection(A.map(R.prop('id')), B.map(R.prop('id')))
      : A.map(R.prop('id'))
    : B.map(R.prop('id'))

  logger.log(`[MiniSearchIndex/search:${task}/2] hits`, set.length)
  const cache = id => this.mirror_[id]
  const result = set.reduce((acc, id) => {
    const item = cache(id)
    const option = options[item.id.split(':')[0]](item, cache)
    acc.push(option)
    return acc
  }, [])

  logger.timeEnd(`[MiniSearchIndex/search:${task}/2]`)
  return result
}
