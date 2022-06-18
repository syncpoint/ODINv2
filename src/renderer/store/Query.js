import util from 'util'
import Emitter from '../../shared/emitter'

/**
 * @constructor
 */
export function Query (index, terms, callback) {
  Emitter.call(this)
  this.index = index
  this.terms = terms
  this.callback = callback

  this.updatedHandler_ = () => this.refresh_()
  this.index.on('index/updated', this.updatedHandler_)
  this.refresh_()
}

util.inherits(Query, Emitter)


/**
 * Refresh query result with updated index and original search terms.
 */
Query.prototype.refresh_ = function () {
  // TODO: d0bb6e10-080a-4fe6-85b6-563cbd571d7f - query/performance: skip search if result does not contain updated ids
  try {
    const result = this.index.search(this.terms)
    this.callback(result)
  } catch (err) {
    /* don't invoke callback. */
    console.log(err)
  }
}


/**
 * Dispose this query instance.
 * Note: Failing to dispose query will result in listener leak (index).
 */
Query.prototype.dispose = function () {
  this.index.off('index/updated', this.updatedHandler_)
}
