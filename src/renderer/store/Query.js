import util from 'util'
import Emitter from '../../shared/emitter'

/**
 * @constructor
 * @fires change { result: Promise[Option] }
 */
export function Query (index, terms) {
  Emitter.call(this)
  this.index_ = index
  this.terms_ = terms
  this.updatedHandler_ = this.refresh_.bind(this)
  this.index_.on('index/updated', this.updatedHandler_)
  this.refresh_()
}

util.inherits(Query, Emitter)


/**
 * Refresh query result with updated index and original search terms.
 */
Query.prototype.refresh_ = async function () {
  // TODO: d0bb6e10-080a-4fe6-85b6-563cbd571d7f - query/performance: skip search if result does not contain updated ids
  this.result_ = this.index_.search(this.terms_)

  // Store Promise, but wait for result befor emitting change event.
  await this.result_
  this.emit('change', { result: this.result_ })
}


/**
 * getResult :: () => Promise([Option])
 */
Query.prototype.getResult = function () {
  return this.result_
}


/**
 * Dispose this query instance.
 * Note: Failing to dispose query will result in listener leak (index).
 */
Query.prototype.dispose = function () {
  this.index_.off('index/updated', this.updatedHandler_)
}
