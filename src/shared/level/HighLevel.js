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
 * put :: Key k, Value v => (k, v) -> db -> unit
 * put :: Key k, Value v => {k: v} -> db -> unit
 * put :: Key k, Value v => [[k, v]] -> db -> unit
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
 * get :: Key k, Value v => k -> db -> v
 * get :: Key k, Value v => (k, v) -> db -> v
 *
 * Get value for given key with optional default value if key was not found.
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
 * mget :: Key k => [k] => {k: v}
 */
export const mget = keys => async db => {
  const values = await db.getMany(keys)
  return keys.reduce((acc, key, index) => {
    const value = values[index]
    if (value !== undefined) acc[key] = value
    return acc
  }, {})
}

/**
 * @async
 * entries :: Key k, Value v => db -> {k: v}
 * entries :: Key k, Value v => (db, string) -> {k: v}
 */
export const entries = (db, prefix) => {
  const stream = entriesStream(prefix)(db)
  const fn = (acc, { key, value }) => (acc[key] = value)
  return reduce(fn, {})(stream)
}

/**
 * @async
 * valuesByPrefix :: Value v => db -> [v]
 * valuesByPrefix :: Value v => (db, string) -> [v]
 */
export const valuesByPrefix = (db, prefix) => {
  const stream = valuesStream(prefix)(db)
  const fn = (acc, value) => acc.push(value)
  return reduce(fn, [])(stream)
}

/**
 * @async
 * valuesById :: (Id a, Value v) => (db, [a]) -> [v]
 */
export const valuesById = async (db, ids) => {
  return ids.reduce(async (acc, id) => {
    const xs = await acc
    xs.push(await get(id, false)(db))
    return xs
  }, [])
}

/**
 * @async
 * keys :: Key k => db -> [k]
 * keys :: Key k => (db, string) -> [k]
 */
export const keys = (db, prefix) => {
  const stream = keysStream(prefix)(db)
  const fn = (acc, value) => acc.push(value)
  return reduce(fn, [])(stream)
}

/**
 * @async
 * list :: Key k, Value v => db -> [[k, v]]
 * list :: Key k, Value v => (db, string) -> [[k, v]]
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

HighLevel.prototype.put = function (...args) {
  return put(...args)(this.db_)
}

HighLevel.prototype.get = async function (key, value) {
  return get(key, value)(this.db_)
}

HighLevel.prototype.mget = async function (keys) {
  return mget(keys)(this.db_)
}

HighLevel.prototype.del = function (key) {
  return this.db_.del(key)
}

HighLevel.prototype.batch = function (ops) {
  return this.db_.batch(ops)
}

HighLevel.prototype.entries = function (prefix) {
  return entries(this.db_, prefix)
}

HighLevel.prototype.values = function (arg) {
  if (Array.isArray(arg)) return valuesById(this.db_, arg)
  else return valuesByPrefix(this.db_, arg)
}

HighLevel.prototype.existsKey = function (prefix) {
  return new Promise((resolve, reject) => {
    const options = { ...keysOptions(prefix), limit: 1 }
    readStream(options)(this.db_)
      .on('data', () => resolve(true))
      .on('error', reject)
      .on('close', () => resolve(false))
  })
}

HighLevel.prototype.keys = function (prefix) {
  return keys(this.db_, prefix)
}

HighLevel.prototype.list = function (prefix) {
  return list(this.db_, prefix)
}

/**
 * @async
 * assign :: Key k, Value v => (k, v) -> unit
 */
HighLevel.prototype.assign = async function (key, value) {
  const target = Object.assign(await this.db_.get(key), value)
  return this.db_.put(key, target)
}
