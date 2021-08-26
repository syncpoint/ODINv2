import util from 'util'
import Emitter from '../../shared/emitter'
// import { Lunr as Index } from './Lunr'
import { MiniSearchIndex as Index } from './MiniSearch'
import { Query } from './Query'





/**
 * @constructor
 */
export function SearchIndex (db) {
  Emitter.call(this)
  this.index_ = new Index(db)

  db.on('put', event => console.log('[DB] put', event))
  db.on('del', event => console.log('[DB] del', event))
  db.on('batch', event => setImmediate(() => this.handleBatch_(event)))
}

util.inherits(SearchIndex, Emitter)


/**
 *
 */
SearchIndex.prototype.handleBatch_ = async function (event) {
  if (this.busy_) {
    this.queue_ = this.queue_ || []
    this.queue_.push(event)
    return
  }

  this.busy_ = true
  this.queue_ = []
  await this.index_.handleBatch(event)
  this.busy_ = false

  if (this.queue_.length) await this.handleBatch_(this.queue_.flat())
  this.emit('index/updated')
}

/**
 * query :: string -> Promise(Query)
 */
SearchIndex.prototype.query = function (terms) {
  const query = () => new Query(this, terms)
  return new Promise((resolve) => {
    const index = this.index_
    if (index.ready()) resolve(query())
    else index.once('ready', () => resolve(query()))
  })
}

SearchIndex.prototype.search = function (query) {
  return this.index_.search(query)
}
