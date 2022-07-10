import util from 'util'
import Emitter from '../../shared/emitter'

/**
 * @constructor
 */
export function Query (index, services, terms, callback) {
  Emitter.call(this)
  this.index = index
  this.services = services
  this.emitter = services.emitter
  this.terms = terms
  this.callback = callback

  this.updatedHandler_ = () => this.refresh()
  this.index.on('index/updated', this.updatedHandler_)
  this.emitter.on('preferences/changed', this.updatedHandler_)
  this.refresh()
}

util.inherits(Query, Emitter)


/**
 * Refresh query result with updated index and original search terms.
 */
Query.prototype.refresh = async function () {
  try {
    const result = await this.index.search(this.services, this.terms)
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
  this.emitter.off('preferences/changed', this.updatedHandler_)
}
