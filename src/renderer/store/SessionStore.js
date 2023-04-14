import util from 'util'
import Emitter from '../../shared/emitter'
import * as L from '../../shared/level'

export default function SessionStore (db) {
  Emitter.call(this)
  this.db = db
  this.cache = {}

  this.db.on('put', (key, value) => this.emit('put', { key, value }))
  this.db.on('del', (key) => this.emit('del', { key }))
}

util.inherits(SessionStore, Emitter)

SessionStore.prototype.DEFAULT_VIEWPORT = {
  center: [1823376.75753279, 6143598.472197734], // Vienna
  resolution: 612,
  rotation: 0
}

SessionStore.prototype.put = function (key, value) {
  this.cache[key] = value
  this.db.put(key, value)
}

SessionStore.prototype.get = async function (key, defaultValue) {
  if (this.cache[key]) return this.cache[key]
  else {
    const value = await L.get(this.db, key, defaultValue)
    this.cache[key] = value
    return value
  }
}

SessionStore.prototype.del = async function (key) {
  await this.db.del(key)
  delete this.cache[key]
}
