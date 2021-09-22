import * as R from 'ramda'
import util from 'util'
import Emitter from '../../shared/emitter'
import { MiniSearchIndex as Index } from './MiniSearch'
import { Query } from './Query'
import { isGroupId } from '../ids'
import { options } from '../model/options'


const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
const compare = fn => (a, b) => {
  const A = fn(a)
  const B = fn(b)
  return A
    ? B
      ? collator.compare(A, B)
      : -1
    : 1
}

export const sort = entries => entries.sort((a, b) => {
  // Sort group to the top:
  const GA = isGroupId(a.id)
  const GB = isGroupId(b.id)
  if (GA && !GB) return -1
  if (!GA && GB) return 1

  return compare(R.prop('title'))(a, b) ||
    compare(R.prop('description'))(a, b)
})


/**
 * @constructor
 */
export function SearchIndex (propertiesLevel) {
  Emitter.call(this)
  this.carrera_ = {}
  this.index_ = new Index(this.carrera_)

  window.requestIdleCallback(async () => {
    await new Promise((resolve, reject) => {
      propertiesLevel.createReadStream()
        .on('data', ({ key, value }) => (this.carrera_[key] = value))
        .on('error', reject)
        .on('close', () => resolve())
    })

    this.index_.createIndex_()
  }, { timeout: 2000 })

  // TODO: investigate - it seems put event does not carry properties as promised (key, value)
  propertiesLevel.on('put', event => console.log('[DB] put', event))
  propertiesLevel.on('del', key => this.handleBatch_([{ type: 'del', key }]))
  propertiesLevel.on('batch', event => this.handleBatch_(event))
}

util.inherits(SearchIndex, Emitter)


/**
 *
 */
SearchIndex.prototype.handleBatch_ = function (event) {
  event.forEach(op => {
    switch (op.type) {
      case 'put': this.carrera_[op.key] = op.value; break
      case 'del': delete this.carrera_[op.key]; break
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

SearchIndex.prototype.search = function (query) {
  const items = this.index_.search(query)
  const cache = id => this.carrera_[id]
  const option = item => {
    const fn = options[item.id.split(':')[0]]
    if (!fn) return null
    return fn(item, cache)
  }

  return sort(items.map(option).filter(R.identity))
}
