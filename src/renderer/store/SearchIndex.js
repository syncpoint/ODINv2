import * as R from 'ramda'
import util from 'util'
import Emitter from '../../shared/emitter'
// import { Lunr as Index } from './Lunr'
import { MiniSearchIndex as Index } from './MiniSearch'
import { Query } from './Query'
import { isGroupId } from '../ids'


export const limit = R.take(200)
// const limit = R.identity /* no limits */

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
const compare = fn => (a, b) => collator.compare(fn(a), fn(b))
const field = x => x.title + x.description

export const sort = entries => entries.sort((a, b) => {
  // Sort group to the top:
  const GA = isGroupId(a.id)
  const GB = isGroupId(b.id)
  if (!GA && !GB) return compare(field)(a, b)
  else if (GA && !GB) return -1
  else if (!GA && GB) return 1
  else return compare(field)(a, b)
})


/**
 * @constructor
 */
export function SearchIndex (propertiesLevel) {
  Emitter.call(this)
  this.mirror_ = {}
  this.index_ = new Index(this.mirror_)

  window.requestIdleCallback(async () => {
    await new Promise((resolve, reject) => {
      propertiesLevel.createReadStream()
        .on('data', ({ key, value }) => (this.mirror_[key] = value))
        .on('error', reject)
        .on('close', () => resolve())
    })

    this.index_.createIndex_()
  }, { timeout: 2000 })

  propertiesLevel.on('put', event => console.log('[DB] put', event))
  propertiesLevel.on('del', event => console.log('[DB] del', event))
  propertiesLevel.on('batch', event => this.handleBatch_(event))
}

util.inherits(SearchIndex, Emitter)


/**
 *
 */
SearchIndex.prototype.handleBatch_ = function (event) {

  event.forEach(op => {
    switch (op.type) {
      case 'put': this.mirror_[op.key] = op.value; break
      case 'del': delete this.mirror_[op.key]; break
    }
  })

  if (this.busy_) {
    this.queue_ = this.queue_ || []
    this.queue_.push(event)
    return
  }

  this.busy_ = true
  this.queue_ = []
  this.index_.handleBatch(event)
  this.busy_ = false

  if (this.queue_.length) this.handleBatch_(this.queue_.flat())
  this.emit('index/updated')
}

/**
 * query :: string -> Promise(Query)
 */
SearchIndex.prototype.query = function (terms, callback) {
  const query = () => new Query(this, terms, callback)
  return new Promise((resolve) => {
    const index = this.index_
    if (index.ready()) resolve(query())
    else index.once('ready', () => resolve(query()))
  })
}

SearchIndex.prototype.search = async function (query, abortSignal) {
  const options = await this.index_.search(query, abortSignal)
  return sort(options)
}
