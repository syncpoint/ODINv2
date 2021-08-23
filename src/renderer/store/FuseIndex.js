import util from 'util'
import Fuse from 'fuse.js'
import * as R from 'ramda'
import Store from '../../shared/level/Store'
import Emitter from '../../shared/emitter'
import { documents } from './documents'
import { options } from '../model/options'

/**
 * @constructor
 * @fires ready
 * @fires index/updated
 */
export function FuseIndex (db) {
  Emitter.call(this)
  this.store_ = new Store(db)

  db.on('put', event => console.log('[DB] put', event))
  db.on('del', event => console.log('[DB] del', event))
  db.on('batch', event => this.handleBatch_(event))

  this.ready_ = false
  const pendingRefresh = this.refreshIndex_()
  pendingRefresh.then(() => {
    this.ready_ = true
    this.emit('ready')
  })

}

util.inherits(FuseIndex, Emitter)


/**
 *
 */
FuseIndex.prototype.handleBatch_ = async function (ops) {
  console.log('[LevelSI] handleBatch_', ops)
}


/**
 *
 */
FuseIndex.prototype.refreshIndex_ = async function () {
  console.time('[FuseIndex] re-index')

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

  const input = docs.map(doc => {
    doc.tags = doc.tags.flat().filter(R.identity).join(' ')
    return doc
  })

  const options = {
    keys: ['scope', 'text', 'tags'],
    includeScore: true,
    includeMatches: true,
    distance: 10
  }

  this.index_ = new Fuse(input, options)

  this.emit('index/updated')
  console.timeEnd('[FuseIndex] re-index')
}


/**
 *
 */
FuseIndex.prototype.ready = function () {
  return this.ready_
}


/**
 *
 */
FuseIndex.prototype.search = function (query) {
  const { scope, text, tags } = parseQuery(query)
  const terms = [scope, ...text, ...tags]
    .flat()
    .filter(R.identity)
    // .map(term => `^${term}`)
    .join(' ')

  const set = this.index_.search(terms)
    .filter(match => match.item.scope === scope)
    .filter(match => match.score < 0.5)

  const cache = memoize(this.store_.get.bind(this.store_))
  return set.reduce(async (acc, match) => {
    const list = await acc
    const item = await cache(match.item.id)
    const option = await options[item.id.split(':')[0]](item, cache)
    list.push(option)
    return list
  }, [])
}
