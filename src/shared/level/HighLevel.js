const options = ({ keys, values }) => prefix => prefix
  ? { keys, values, gte: prefix, lte: prefix + '\xff' }
  : { keys, values }

export const valuesOptions = options({ keys: false, values: true })
export const entriesOptions = options({ keys: true, values: true })
export const keysOptions = options({ keys: true, values: false })

export const readStream = options => db => db.createReadStream(options)
export const valuesStream = prefix => readStream(valuesOptions(prefix))
export const entriesStream = prefix => readStream(entriesOptions(prefix))
export const keysStream = prefix => readStream(keysOptions(prefix))

export const reduce = (fn, acc) => stream => {
  return new Promise((resolve, reject) => {
    stream
      .on('data', data => (fn(acc, data)))
      .on('error', reject)
      .on('close', () => resolve(acc))
  })
}

/**
 * @async
 * put :: String key, Any value => key -> value -> unit
 * put :: {key -> value} -> unit
 * put :: String key, Any value => [[key, value]] -> unit
 */
export const put = (...args) => db => {
  if (args.length === 2) return db.put(args[0], args[1]) // key/value
  else if (args.length === 1) {
    const ops = xs => xs.map(([key, value]) => ({ type: 'put', key, value }))
    const batch = Array.isArray(args[0])
      ? ops(args[0]) // [[key/value]]
      : ops(Object.entries(args[0])) // {key -> value}

    return db.batch(batch)
  }
}

/**
 * @async
 * get :: String key => key -> value
 * get :: String key, Any default => key -> value | default
 */
export const get = (key, value) => async db => {
  try {
    return await db.get(key)
  } catch (err) {
    if (typeof value === 'undefined') throw err
    else return value
  }
}

/**
 * @async
 * entries :: db -> {key -> value}
 * entries :: db -> string -> {key -> value}
 */
export const entries = (db, prefix) => {
  const stream = entriesStream(prefix)(db)
  const fn = (acc, { key, value }) => (acc[key] = value)
  return reduce(fn, {})(stream)
}

/**
 * @async
 * values :: db -> [value]
 * values :: db -> string -> [value]
 */
export const values = (db, prefix) => {
  const stream = valuesStream(prefix)(db)
  const fn = (acc, value) => acc.push(value)
  return reduce(fn, [])(stream)
}

/**
 * @async
 * keys :: db -> [key]
 * keys :: db -> string -> [key]
 */
export const keys = (db, prefix) => {
  const stream = keysStream(prefix)(db)
  const fn = (acc, value) => acc.push(value)
  return reduce(fn, [])(stream)
}

/**
 * @async
 * list :: () -> [[key, value], ...]
 * list :: String -> [[key, value], ...]
 */
export const list = (db, prefix) => {
  const stream = entriesStream(prefix)(db)
  const fn = (acc, { key, value }) => acc.push([key, value])
  return reduce(fn, [])(stream)
}


/**
 * Convenience/high LevelDB API.
 * @param {*} db LevelUp compatible database
 */
export const HighLevel = function (db) {
  this.db_ = db
}

/**
 * @async
 * put :: String key, Any value => key -> value -> unit
 * put :: {key -> value} -> unit
 * put :: String key, Any value => [[key, value]] -> unit
 */
HighLevel.prototype.put = function (...args) {
  return put(...args)(this.db_)
}

/**
 * get :: String key => key => Promise(value)
 * get :: String key, Any default => key => Promise(value || default)
 *
 * Get value for given key with optional default value if key was not found.
 */
HighLevel.prototype.get = async function (key, value) {
  return get(key, value)(this.db_)
}

HighLevel.prototype.del = function (key) {
  return this.db_.del(key)
}

HighLevel.prototype.entries = function (prefix) {
  return entries(this.db_, prefix)
}

HighLevel.prototype.values = function (prefix) {
  return values(this.db_, prefix)
}

HighLevel.prototype.keys = function (prefix) {
  return keys(this.db_, prefix)
}

HighLevel.prototype.list = function (prefix) {
  return list(this.db_, prefix)
}

/**
 * @async
 * assign :: key -> value -> unit
 */
HighLevel.prototype.assign = async function (key, value) {
  const target = Object.assign(await this.db_.get(key), value)
  return this.db_.put(key, target)
}
