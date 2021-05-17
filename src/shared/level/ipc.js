import util from 'util'
import { AbstractLevelDOWN, AbstractIterator } from 'abstract-leveldown'

export const GET = 'level:get'
export const PUT = 'level:put'
export const DEL = 'level:del'
export const ITERATOR = 'level:iterator'

/**
 * Iterator which fetches complete result at once.
 *
 * @param {*} db IPCDownClient instance
 * @param {*} options iterator options
 */
function IPCIterator (db, options) {
  AbstractIterator.call(this, db)
  this._index = -1

  // Promise of array which is comsumed in _next()
  this._acc = db._ipc.invoke(ITERATOR, options)
}

util.inherits(IPCIterator, AbstractIterator)

IPCIterator.prototype._next = function (callback) {
  this._acc.then(result => {
    this._index += 1
    if (this._index === result.length) return this._nextTick(callback)
    const { key, value } = result[this._index]
    this._nextTick(callback, null, key, value)
  })
}


/**
 * Leveldown implementation which communicates with server through IPC.
 *
 * @param {*} ipc ipcMain or ipcRenderer instance.
 */
export function IPCDownClient (ipc) {
  AbstractLevelDOWN.call(this)
  this._ipc = ipc
}

util.inherits(IPCDownClient, AbstractLevelDOWN)

IPCDownClient.prototype._get = function (key, options, callback) {
  this._ipc.invoke(GET, key, options)
    .then(value => this._nextTick(callback, null, value))
    .catch(err => this._nextTick(callback, err))
}

IPCDownClient.prototype._put = function (key, value, options, callback) {
  this._ipc.invoke(PUT, key, value, options)
    .then(() => this._nextTick(callback))
    .catch(err => this._nextTick(callback, err))
}

IPCDownClient.prototype._del = function (key, options, callback) {
  this._ipc.invoke(DEL, key, options)
    .then(() => this._nextTick(callback))
    .catch(err => this._nextTick(callback, err))
}

IPCDownClient.prototype._iterator = function (options) {
  return new IPCIterator(this, options)
}


/**
 * Wrap Levelup database as IPC endpoint for IPC client.
 *
 * @param {*} db Levelup instance
 * @param {*} ipc ipcMain instance.
 */
export function IPCServer (db, ipc) {

  ipc.handle(GET, async (event, key, options) => {
    return await db.get(key)
  })

  ipc.handle(PUT, async (event, key, value, options) => {
    return await db.put(key, value)
  })

  ipc.handle(DEL, async (event, key, options) => {
    return await db.del(key)
  })

  ipc.handle(ITERATOR, async (event, options) => {
    return await new Promise((resolve, reject) => {
      const acc = []
      db.createReadStream(options)
        .on('data', data => acc.push(data))
        .on('error', err => reject(err))
        .on('end', () => resolve(acc))
    })
  })
}
