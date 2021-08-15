/**
 * Convenience LevelDB API.
 * @param {*} db LevelUp compatible database
 */
const Store = function (db) {
  this.db = db
}


/**
 * close :: () -> Promise
 */
Store.prototype.close = function () {
  return this.db.close()
}


/**
 * put :: String key, Any value => key -> value -> Promise
 * put :: { key -> value } -> Promise
 * put :: String key, Any value => [[key, value]] -> Promise
 */
Store.prototype.put = function (...args) {
  if (args.length === 2) return this.db.put(args[0], args[1]) // key/value
  else if (args.length === 1) {
    const ops = xs => xs.map(([key, value]) => ({ type: 'put', key, value }))

    const batch = Array.isArray(args[0])
      ? ops(args[0]) // [[key/value]]
      : ops(Object.entries(args[0]))

    return this.db.batch(batch)
  }
}


/**
 * get :: String key => key => Promise(value)
 * get :: String key, Any default => key => Promise(value || default)
 *
 * Get value for given key with optional default value.
 */
Store.prototype.get = async function (key, value) {
  try {
    return await this.db.get(key)
  } catch (err) {
    if (typeof value === 'undefined') throw err
    else return value
  }
}

Store.prototype.del = function (key) {
  return this.db.del(key)
}


/**
 * entries :: () -> Promise({ key -> value })
 * entries :: String -> Promise({ key -> value })
 */
Store.prototype.entries = function (prefix) {
  const options = prefix
    ? { keys: true, values: true, gte: prefix, lte: prefix + '\xff' }
    : { keys: true, values: true }

  const acc = {}
  return new Promise((resolve, reject) => {
    this.db.createReadStream(options)
      .on('data', ({ key, value }) => (acc[key] = value))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * values :: () -> Promise([value])
 * values :: String -> Promise([value])
 */
Store.prototype.values = function (prefix) {
  const options = prefix
    ? { keys: false, values: true, gte: prefix, lte: prefix + '\xff' }
    : { keys: false, values: true }

  const acc = []
  return new Promise((resolve, reject) => {
    this.db.createReadStream(options)
      .on('data', value => acc.push(value))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * list :: () -> Promise([[key, value], ...])
 * list :: String -> Promise([[key, value], ...])
 *
 * Note: Does only support Object values (i.e. non-scalar values)
 */
Store.prototype.list = function (prefix) {
  const options = prefix
    ? { keys: true, values: true, gte: prefix, lte: prefix + '\xff' }
    : { keys: true, values: true }

  const acc = []
  return new Promise((resolve, reject) => {
    this.db.createReadStream(options)
      .on('data', ({ key, value }) => acc.push([key, value]))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * key :: (Object -> Boolean) -> Promise(String)
 * key :: (Object -> Boolean) -> String -> Promise(String)
 */
Store.prototype.key = function (predicate, prefix) {
  const options = prefix
    ? { keys: true, values: true, gte: prefix, lte: prefix + '\xff' }
    : { keys: true, values: true }

  return new Promise((resolve, reject) => {
    const stream = this.db.createReadStream(options)

    const data = ({ key, value }) => {
      if (predicate(value)) {
        stream.destroy()
        resolve(key)
      }
    }

    stream.on('data', data)
      .on('error', reject)
      .on('end', () => resolve(undefined))
  })
}

/**
 * assign :: key -> value -> Promise()
 */
Store.prototype.assign = async function (key, value) {
  const target = Object.assign(await this.db.get(key), value)
  return this.db.put(key, target)
}

export default Store
