import util from 'util'
import MiniSearch from 'minisearch'
import * as R from 'ramda'
import uuid from 'uuid-random'
import Store from '../../shared/level/Store'
import { documents } from './documents'
import Emitter from '../../shared/emitter'
import { options } from '../model/options'
import { memoize, parseQuery } from './index-common'

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
export function MiniSearchIndex (db) {
  Emitter.call(this)
  this.store_ = new Store(db)

  // Cache indexed documents for removal.
  this.cache_ = {}

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

  // Give startup routine up to 2s before doing any heavy lifting.
  window.requestIdleCallback(() => {
    this.createIndex_().then(() => {
      this.ready_ = true
      this.emit('ready')
    })
  }, { timeout: 2000 })
}

util.inherits(MiniSearchIndex, Emitter)


/**
 * Create initial index (one time only).
 */
MiniSearchIndex.prototype.createIndex_ = async function () {
  logger.log('[MiniSearchIndex/createIndex_]')
  logger.time('[MiniSearchIndex/createIndex_]')
  const entries = await this.store_.values()
  logger.log('[MiniSearchIndex/createIndex_] entries', entries.length)
  const cache = memoize(this.store_.get.bind(this.store_))
  const docs = await entries.reduce(async (acc, entry) => {
    const scope = entry.id.split(':')[0]
    const docs = await acc
    const doc = await documents[scope](entry, cache)
    docs.push(doc)
    logger.log('[MiniSearchIndex/createIndex_] progress', docs.length, 'of', entries.length)
    return docs
  }, [])

  docs.forEach(doc => (this.cache_[doc.id] = doc))
  this.index_.addAll(docs)
  logger.timeEnd('[MiniSearchIndex/createIndex_]')
}


/**
 * Update index based on store batch operations.
 */
MiniSearchIndex.prototype.handleBatch = async function (ops) {
  logger.log('[MiniSearchIndex/handleBatch]')
  logger.time('[MiniSearchIndex/handleBatch]')
  const cache = memoize(this.store_.get.bind(this.store_))
  const updates = ops.filter(op => op.type === 'put')
  const removals = ops.filter(op => op.type === 'del')

  for (const op of updates) {
    const scope = op.key.split(':')[0]
    this.index_.remove(this.cache_[op.key])
    this.cache_[op.key] = await documents[scope](op.value, cache)
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
MiniSearchIndex.prototype.search = async function (query, abortSignal) {
  const terms = parseQuery(query)
  const { scope, text, tags } = terms
  if (!text.length && !tags.length) return this.searchScope_(scope, abortSignal)
  else return this.searchFiltered_(terms, abortSignal)
}


/**
 *
 */
MiniSearchIndex.prototype.searchScope_ = async function (scope, abortSignal) {
  const task = uuid()
  logger.log(`[MiniSearchIndex/search:${task}/1]`)
  logger.time(`[MiniSearchIndex/search:${task}/1]`)
  const items = await this.store_.values(scope)
  logger.log(`[MiniSearchIndex/search:${task}/1]: items`, items.length)
  const cache = memoize(this.store_.get.bind(this.store_))
  const result = await items.reduce(async (acc, item) => {
    const list = await acc
    const option = await options[item.id.split(':')[0]](item, cache)
    if (abortSignal.aborted) throw new Error(`[MiniSearchIndex/search:${task}/1] aborted`)
    list.push(option)
    logger.log(`[MiniSearchIndex/search:${task}/1]: progress`, list.length, 'of', items.length)
    return list
  }, [])

  logger.timeEnd(`[MiniSearchIndex/search:${task}/1]`)
  return result
}

MiniSearchIndex.prototype.searchFiltered_ = async function (terms, abortSignal) {
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
  const cache = memoize(this.store_.get.bind(this.store_))
  const result = await set.reduce(async (acc, id) => {
    const list = await acc
    const item = await cache(id)
    const option = await options[item.id.split(':')[0]](item, cache)
    if (abortSignal.aborted) throw new Error(`[MiniSearchIndex/search:${task}] aborted`)
    list.push(option)
    return list
  }, [])

  logger.timeEnd(`[MiniSearchIndex/search:${task}/2]`)
  return result
}
