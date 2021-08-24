import util from 'util'
import MiniSearch from 'minisearch'
import * as R from 'ramda'
import Store from '../../shared/level/Store'
import { documents } from './documents'
import Emitter from '../../shared/emitter'
import { options } from '../model/options'
import { memoize, parseQuery } from './index-common'

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
  const pendingRefresh = this.refreshIndex_()
  pendingRefresh.then(() => {
    this.ready_ = true
    this.emit('ready')
  })
}

util.inherits(MiniSearchIndex, Emitter)


/**
 *
 */
MiniSearchIndex.prototype.handleBatch = async function (ops) {
  console.time('[MiniSearch] batch')
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

  this.emit('index/updated')
  console.timeEnd('[MiniSearch] batch')
}


/**
 *
 */
MiniSearchIndex.prototype.refreshIndex_ = async function () {
  console.time('[MiniSearch] re-index')

  const entries = await this.store_.entries()
  const cache = memoize(this.store_.get.bind(this.store_))
  const docs = await Promise.all(Object.values(entries)
    .map(item => [item.id.split(':')[0], item])
    .map(([scope, item]) => documents[scope](item, cache))
  )

  docs.forEach(doc => (this.cache_[doc.id] = doc))

  this.index_.addAll(docs)
  this.emit('index/updated')
  console.timeEnd('[MiniSearch] re-index')
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
MiniSearchIndex.prototype.search = async function (query) {
  const { scope, text, tags } = parseQuery(query)
  const filter = scope
    ? result => result.id.startsWith(scope)
    : () => true

  if (!text.length && !tags.length) {
    const items = await this.store_.values(scope)
    const cache = memoize(this.store_.get.bind(this.store_))
    return items.reduce(async (acc, item) => {
      const list = await acc
      const option = await options[item.id.split(':')[0]](item, cache)
      list.push(option)
      return list
    }, [])
  }

  const A = this.index_.search(text.join(' '), { fields: ['text'], prefix: true, filter, combineWith: 'AND' })
  const B = this.index_.search(tags.join(' '), { fields: ['tags'], prefix: true, filter, combineWith: 'AND' })

  // Intersect result A with B.
  const set = A.length
    ? B.length
      ? R.intersection(A.map(R.prop('id')), B.map(R.prop('id')))
      : A.map(R.prop('id'))
    : B.map(R.prop('id'))

  const cache = memoize(this.store_.get.bind(this.store_))
  return set.reduce(async (acc, id) => {
    const list = await acc
    const item = await cache(id)
    const option = await options[item.id.split(':')[0]](item, cache)
    list.push(option)
    return list
  }, [])
}
