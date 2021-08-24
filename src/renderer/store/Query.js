import util from 'util'
import Emitter from '../../shared/emitter'

/**
 * @constructor
 * @fires change { result }
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
  this.result_ = this.index_.search(this.terms_)
  this.emit('change', { result: this.result_ })
}


/**
 * this.getResult :: () -> Promise([option])
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
