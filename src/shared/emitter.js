import { match as exec } from 'path-to-regexp'
import { error, ERR_INVALID_ARG } from '../shared/error'


/**
 * @constructor
 */
const EventEmitter = function () {}

EventEmitter.prototype.on = function (pattern, handler) {
  this.handlers = this.handlers || {}
  this.handlers[pattern] = this.handlers[pattern] || []
  this.handlers[pattern].push(handler)
  return this
}

EventEmitter.prototype.once = function (pattern, handler) {
  this.handlers = this.handlers || {}

  const proxy = event => {
    handler(event)
    this.handlers[pattern] = this.handlers[pattern].filter(fn => fn !== proxy)
  }

  this.handlers[pattern] = this.handlers[pattern] || []
  this.handlers[pattern].push(proxy)
  return this
}

EventEmitter.prototype.emit = function (path, arg = {}) {
  this.handlers = this.handlers || {}
  const entries = Object.entries(this.handlers)

  const paths = entries.reduce((acc, [pattern, handlers]) => {
    const match = exec(pattern)(path)
    return match ? acc.concat([[match, handlers]]) : acc
  }, [])

  return paths.reduce((acc, [match, handlers]) => {
    const event = { ...arg, path: match.path, ...match.params }
    const handle = handler => handler(event)
    handlers.forEach(handle)
    return acc || handlers.length !== 0
  }, false)
}

EventEmitter.prototype.off = function (pattern, handler) {
  if (!pattern) throw error(ERR_INVALID_ARG, '"pattern" argument is undefined')
  if (!handler) throw error(ERR_INVALID_ARG, '"handler" argument is undefined')
  if (typeof handler !== 'function') throw error(ERR_INVALID_ARG, '"handler" function expected')

  this.handlers = this.handlers || {}
  if (this.handlers[pattern]) {
    this.handlers[pattern] = this.handlers[pattern].filter(fn => fn !== handler)
    if (this.handlers[pattern].length === 0) delete this.handlers[pattern]
  }

  return this
}

export default EventEmitter
