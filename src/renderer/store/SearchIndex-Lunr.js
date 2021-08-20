import util from 'util'
import * as R from 'ramda'
import lunr from 'lunr'
import Store from '../../shared/level/Store'
import { documents } from './documents'
import Emitter from '../../shared/emitter'


/**
 *
 */
export function SearchIndex (db) {
  Emitter.call(this)
  this.store_ = new Store(db)

  db.on('open', () => console.log('[DB] open'))
  db.on('put', event => console.log('[DB] open', event))
  db.on('del', event => console.log('[DB] del', event))
  db.on('batch', event => console.log('[DB] batch', event))

  this.indexes_ = {
    layer: null,
    feature: null
  }

  Object.keys(this.indexes_).forEach(scope => this.refreshIndex_(scope))
}

util.inherits(SearchIndex, Emitter)


/**
 *
 */
SearchIndex.prototype.refreshIndex_ = async function (scope) {
  console.time(`[lunr:${scope}] re-index`)

  const entries = await this.store_.entries(scope)
  const cache = id => {
    const hit = entries[id]
    if (hit) return hit
    entries[id] = this.store_.get(id)
    return cache(id)
  }

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

  console.log('emitting event', `${scope}:index/updated`)
  this.emit(`${scope}/index/updated`)
  console.timeEnd(`[lunr:${scope}] re-index`)
}


/**
 *
 */
SearchIndex.prototype.search = function (terms) {
  const searchIndex = index => R.tryCatch(
    terms => terms.trim() ? index.search(terms.trim()) : [],
    R.always([])
  )

  return Object.values(this.indexes_)
    .reduce((acc, index) => acc.concat(searchIndex(index)(terms)), [])
}
