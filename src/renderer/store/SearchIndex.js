// import { Lunr as Index } from './Lunr'
import { MiniSearchIndex as Index } from './MiniSearch'
import { DebouncingQueue } from './DebouncingQueue'
import { Query } from './Query'





/**
 * @constructor
 */
export function SearchIndex (db) {
  this.index_ = new Index(db)

  const timeout = 50 // ms
  const size = 10 // events
  this.DQ_ = new DebouncingQueue(timeout, size)

  this.DQ_.on('data', ({ data }) => {
    console.log('data/handleBatch')
    this.index_.handleBatch(data.flat())
  })

  db.on('put', event => console.log('[DB] put', event))
  db.on('del', event => console.log('[DB] del', event))
  db.on('batch', event => this.handleBatch_(event))
}


/**
 * FIXME: handleBatch is not re-entrant (rapid sequence of consecutive store updates)
 */
SearchIndex.prototype.handleBatch_ = function (event) {
  console.log('pushing event...')
  this.DQ_.push(event)
}

/**
 * query :: string -> Promise(Query)
 */
SearchIndex.prototype.query = function (terms) {
  return new Promise((resolve) => {
    const index = this.index_
    if (index.ready()) resolve(new Query(index, terms))
    else {
      index.once('ready', () => resolve(new Query(index, terms)))
    }
  })
}
