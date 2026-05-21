export const GET = 'level:get'
export const PUT = 'level:put'
export const DEL = 'level:del'
export const ITERATOR = 'level:iterator'

/**
 * Level client which proxies operations to an `IPCServer` over IPC.
 *
 * A plain adapter exposing the subset of the API the `L.*` helpers use:
 * get / put / del / iterator / keys / values.
 *
 * @param {*} ipc ipcMain or ipcRenderer instance.
 */
export function IPCDownClient (ipc) {
  this._ipc = ipc
}

IPCDownClient.prototype.get = function (key, options) {
  return this._ipc.invoke(GET, key, options)
}

IPCDownClient.prototype.put = function (key, value, options) {
  return this._ipc.invoke(PUT, key, value, options)
}

IPCDownClient.prototype.del = function (key, options) {
  return this._ipc.invoke(DEL, key, options)
}

/**
 * Fetches the complete result at once, then yields it. The IPC round-trip
 * does not support incremental streaming.
 */
IPCDownClient.prototype.iterator = async function * (options) {
  const result = await this._ipc.invoke(ITERATOR, options)
  for (const { key, value } of result) yield [key, value]
}

IPCDownClient.prototype.keys = async function * (options) {
  for await (const [key] of this.iterator(options)) yield key
}

IPCDownClient.prototype.values = async function * (options) {
  for await (const entry of this.iterator(options)) yield entry[1]
}


/**
 * Exposes an abstract-level database as an IPC endpoint for `IPCDownClient`.
 *
 * @param {*} db abstract-level database.
 * @param {*} ipc ipcMain instance.
 */
export function IPCServer (db, ipc) {
  ipc.handle(GET, async (event, key, options) => db.get(key))
  ipc.handle(PUT, async (event, key, value, options) => db.put(key, value))
  ipc.handle(DEL, async (event, key, options) => db.del(key))

  ipc.handle(ITERATOR, async (event, options) => {
    const acc = []
    for await (const [key, value] of db.iterator(options)) acc.push({ key, value })
    return acc
  })
}
