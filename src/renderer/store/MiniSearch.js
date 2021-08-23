import util from 'util'
import MiniSearch from 'minisearch'
import * as R from 'ramda'
import Store from '../../shared/level/Store'
import { documents } from './documents'
import Emitter from '../../shared/emitter'
import { options } from '../model/options'

/**
 * @constructor
 * @fires ready
 * @fires index/updated (after all scopes are updated)
 */
export function MiniSearchIndex (db) {
  this.store_ = new Store(db)

  db.on('put', event => console.log('[DB] put', event))
  db.on('del', event => console.log('[DB] del', event))
  db.on('batch', event => this.handleBatch_(event))

  this.index_ = new MiniSearch({
    fields: ['text', 'tags'],
    storeFields: ['text', 'tags'],
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
MiniSearchIndex.prototype.handleBatch_ = function (ops) {
  console.log('[MiniSearchIndex] handleBatch_', ops)
  this.emit('index/updated')
}


/**
 *
 */
MiniSearchIndex.prototype.refreshIndex_ = async function () {
  console.time('[MiniSearch:] re-index')

  const entries = await this.store_.entries()
  const cache = id => {
    const hit = entries[id]
    if (hit) return hit
    entries[id] = this.store_.get(id)
    return cache(id)
  }

  const docs = await Promise.all(Object.values(entries)
    .map(item => [item.id.split(':')[0], item])
    .map(([scope, item]) => documents[scope](item, cache))
  )

  this.index_.addAll(docs)
  this.emit('index/updated')
  console.timeEnd('[MiniSearch:] re-index')
}

/**
 *
 */
MiniSearchIndex.prototype.ready = function () {
  return this.ready_
}

function memoize (method) {
  const cache = {}
  return async function () {
    const args = JSON.stringify(arguments)
    cache[args] = cache[args] || method.apply(this, arguments)
    return cache[args]
  }
}

const parseQuery = query => {
  const tokens = (query || '').split(' ')
  return tokens.reduce((acc, token) => {
    if (token.startsWith('@')) acc.scope = token.substring(1)
    else if (token.startsWith('#')) acc.tags.push(token.substring(1))
    else acc.text.push(token)
    return acc
  }, { text: [], tags: [] })
}

/**
 * search :: string -> Promise([option])
 */
MiniSearchIndex.prototype.search = function (query) {
  const { scope, text, tags } = parseQuery(query)
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

  const cache = memoize(this.store_.get.bind(this.store_))
  return set.reduce(async (acc, id) => {
    const list = await acc
    const item = await cache(id)
    const option = await options[item.id.split(':')[0]](item, cache)
    list.push(option)
    return list
  }, [])
}
