import util from 'util'
import * as R from 'ramda'
import lunr from 'lunr'
import Store from '../../shared/level/Store'
import { documents } from './documents'
import Emitter from '../../shared/emitter'
import { options } from '../model/options'
import { memoize } from './index-common'


/**
 * @constructor
 * @fires ready
 * @fires :scope/index/updated (for each scope)
 * @fires index/updated (after all scopes are updated)
 */
export function Lunr (db) {
  Emitter.call(this)
  this.store_ = new Store(db)

  db.on('put', event => console.log('[DB] put', event))
  db.on('del', event => console.log('[DB] del', event))
  db.on('batch', event => this.handleBatch_(event))

  this.indexes_ = {
    layer: null,
    feature: null
  }

  this.ready_ = false
  const refresh = scope => this.refreshIndex_(scope)
  const pendingRefresh = Object.keys(this.indexes_).map(refresh)
  Promise.all(pendingRefresh).then(() => {
    console.log('[Lunr] ready.')
    this.ready_ = true
    this.emit('ready')
  })
}

util.inherits(Lunr, Emitter)


/**
 *
 */
Lunr.prototype.handleBatch_ = function (ops) {
  const scopes = R.uniq(ops.map(op => op.key.split(':')[0]))
  scopes.forEach(scope => this.refreshIndex_(scope))
  this.emit('index/updated')
}


/**
 *
 */
Lunr.prototype.refreshIndex_ = async function (scope) {
  return new Promise((resolve) => {
    setTimeout(async () => {
      console.time(`[lunr:${scope}] re-index`)

      const entries = await this.store_.entries(scope)
      const cache = memoize(this.store_.get.bind(this.store_))
      const docs = await Promise.all(Object.values(entries)
        .map(item => documents[scope](item, cache))
      )

      this.indexes_[scope] = lunr(function () {
        this.pipeline.remove(lunr.stemmer)
        this.pipeline.remove(lunr.stopWordFilter) // allow words like 'so', 'own', etc.
        this.searchPipeline.remove(lunr.stemmer)
        ;['text', 'scope', 'tags'].forEach(field => this.field(field))
        docs.forEach(doc => this.add(doc))
      })

      this.emit(`${scope}/index/updated`)
      console.timeEnd(`[lunr:${scope}] re-index`)
      resolve()
    }, 0)
  })
}


/**
 *
 */
Lunr.prototype.ready = function () {
  return this.ready_
}

const translateTerm = R.cond([
  [R.startsWith('#'), s => s.length < 2 ? '' : `+tags:${s.substring(1)}*`],
  [R.startsWith('@'), s => (s.length < 2) ? '' : `+scope:${s.substring(1)}`],
  [R.identity, s => `+text:${s}*`],
  [R.T, R.always('')]
])

const translateQuery = (value = '') => {
  // Escape query string translation:
  if (value.startsWith(':')) return value.substring(1)
  return value
    .split(' ')
    .filter(R.identity)
    .map(translateTerm)
    .join(' ')
}

/**
 * search :: string -> Promise([option])
 */
Lunr.prototype.search = function (query) {
  const terms = translateQuery(query)
  const searchIndex = index => R.tryCatch(
    terms => terms.trim() ? index.search(terms.trim()) : [],
    R.always([])
  )

  const cache = memoize(this.store_.get.bind(this.store_))
  return Object.values(this.indexes_)
    .reduce((acc, index) => acc.concat(searchIndex(index)(terms)), [])
    .map(R.prop('ref'))
    .reduce(async (acc, id) => {
      const list = await acc
      const item = await cache(id)
      const option = await options[item.id.split(':')[0]](item, cache)
      list.push(option)
      return list
    }, [])
}
