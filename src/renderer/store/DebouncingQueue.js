import util from 'util'
import Emitter from '../../shared/emitter'

/**
 * @constructor
 */
export function DebouncingQueue (timeout, size) {
  Emitter.call(this)
  this.timeout_ = typeof timeout === 'number' ? timeout : -1
  this.size_ = typeof maxBatchSize === 'number' ? size : -1
  this.queue_ = []
}

util.inherits(DebouncingQueue, Emitter)


/**
 *
 */
DebouncingQueue.prototype.push = function (data) {
  clearTimeout(this.timer_)
  this.queue_.push(data)

  if ((this.size_ < 0 && this.timeout_ < 0) || (this.size_ >= 0 && this.data_.length >= this.size_)) {
    this.drain()
  } else if (this.timeout_ >= 0) {
    this.timer_ = setTimeout(() => this.drain_(), this._timeout)
  }
}


/**
 *
 */
DebouncingQueue.prototype.drain_ = function () {
  const data = this.queue_
  this.emit('data', { data })
  this.queue_ = []
}
