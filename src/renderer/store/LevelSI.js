import util from 'util'
import si from 'search-index'
import Fuse from 'fuse.js'
import memdown from 'memdown'
import * as R from 'ramda'
import Store from '../../shared/level/Store'
import Emitter from '../../shared/emitter'
import { documents } from './documents'
import { memoize } from './index-common'

/**
 * @constructor
 * @fires ready
 * @fires index/updated
 */
export function LevelSI (db) {
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

util.inherits(LevelSI, Emitter)


/**
 *
 */
LevelSI.prototype.handleBatch_ = async function (ops) {
  console.log('[LevelSI] handleBatch_', ops)
}


/**
 *
 */
LevelSI.prototype.refreshIndex_ = async function () {
  console.log('[LevelSI] refreshIndex_')
  console.time('[LevelSI] re-index')

  const entries = await this.store_.entries()
  const cache = memoize(this.store_.get.bind(this.store_))
  const docs = await Promise.all(Object.values(entries)
    .map(item => [item.id.split(':')[0], item])
    .map(([scope, item]) => documents[scope](item, cache))
  )

  const input = docs.map(doc => {
    doc._id = doc.id
    delete doc.id
    delete doc.scope
    return doc
  })


  this.textIndex_ = await si({ db: memdown(), storeVectors: true })
  this.tagsIndex_ = await si({ db: memdown(), storeVectors: true })

  const delTags = doc => ({ _id: doc._id, text: doc.text })
  const delText = doc => ({ _id: doc._id, tags: doc.tags.flat().filter(R.identity).join(' ') })

  await this.textIndex_.PUT(input.map(delTags))
  await this.tagsIndex_.PUT(input.map(delText))
  this.textDictionary_ = await this.textIndex_.DICTIONARY()
  this.tagsDictionary_ = await this.tagsIndex_.DICTIONARY()

  const options = { includeScore: true, includeMatches: true, findAllMatches: false }
  this.fuseTags_ = new Fuse(this.tagsDictionary_, options)
  this.fuseText_ = new Fuse(this.textDictionary_, options)
  console.log(this.fuseText_.search('nai').filter(match => match.score < 0.1))

  this.emit('index/updated')
  console.timeEnd('[LevelSI] re-index')
}


/**
 *
 */
LevelSI.prototype.ready = function () {
  return this.ready_
}


/**
 *
 */
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
 *
 */
LevelSI.prototype.search = function (query) {
  const { scope, text, tags } = parseQuery(query)
  console.log('[LevelSI] search', scope, text, tags)
  console.log('[TEXT]', this.fuseText_.search(text.join(' ')).filter(match => match.score < 0.1))
  console.log('[TAGS]', this.fuseTags_.search(tags.join(' ')).filter(match => match.score < 0.1))
  return []
}
