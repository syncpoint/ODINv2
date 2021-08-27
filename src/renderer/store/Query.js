import util from 'util'
import Emitter from '../../shared/emitter'

/**
 * @constructor
 * @fires change { result: Promise[Option] }
 */
export function Query (index, terms, callback) {
  Emitter.call(this)
  this.index_ = index
  this.terms_ = terms
  this.callback_ = callback
  this.abortController_ = new AbortController()

  const abortSignal = this.abortController_.signal
  this.updatedHandler_ = () => this.refresh_(abortSignal)
  this.index_.on('index/updated', this.updatedHandler_)
  this.refresh_(this.abortController_.signal)
}

util.inherits(Query, Emitter)


/**
 * Refresh query result with updated index and original search terms.
 */
Query.prototype.refresh_ = async function (abortSignal) {
  // TODO: d0bb6e10-080a-4fe6-85b6-563cbd571d7f - query/performance: skip search if result does not contain updated ids
  try {
    // FIXME: abort current query (if any) before starting new query
    const result = await this.index_.search(this.terms_, abortSignal)
    if (!abortSignal.aborted) this.callback_(result)
  } catch (err) {
    /* don't invoke callback. */
    console.log(err.message)
  }
}


/**
 * Dispose this query instance.
 * Note: Failing to dispose query will result in listener leak (index).
 */
Query.prototype.dispose = function () {
  this.index_.off('index/updated', this.updatedHandler_)
  this.abortController_.abort()
}
