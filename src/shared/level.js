/**
 * Higher level LevelDB API.
 */

/**
 * Fetch all key/value pairs, optionally limited to keys starting with common prefix.
 */
export const entries = (db, prefix) => new Promise((resolve, reject) => {
  const acc = []
  const options = prefix
    ? { gte: prefix, lte: prefix + '\xff' }
    : {}

  db.createReadStream(options)
    .on('data', data => acc.push(data))
    .on('error', reject)
    .on('end', () => resolve(acc))
})


/**
 * Fetch all values, optionally limited to keys starting with common prefix.
 */
export const values = (db, prefix) => new Promise((resolve, reject) => {
  const acc = []
  const options = prefix
    ? { keys: false, values: true, gte: prefix, lte: prefix + '\xff' }
    : { keys: false, values: true }

  db.createReadStream(options)
    .on('data', data => acc.push(data))
    .on('error', reject)
    .on('end', () => resolve(acc))
})


/**
 * Fetch all keys, optionally limited to keys starting with common prefix.
 */
export const keys = (db, prefix) => new Promise((resolve, reject) => {
  const acc = []
  const options = prefix
    ? { keys: true, values: false, gte: prefix, lte: prefix + '\xff' }
    : { keys: true, values: false }

  db.createReadStream(options)
    .on('data', data => acc.push(data))
    .on('error', reject)
    .on('end', () => resolve(acc))
})


export const aggregate = (db, prefix) => new Promise((resolve, reject) => {
  const acc = {}
  const options = prefix
    ? { keys: true, values: true, gte: prefix, lte: prefix + '\xff' }
    : { keys: true, values: true }

  db.createReadStream(options)
    .on('data', ({ key, value }) => (acc[key.substring(prefix.length)] = value))
    .on('error', reject)
    .on('end', () => resolve(acc))
})


/**
 * Fetch value; on absence return default value.
 */
export const get = async (db, key, defaultValue) => {
  try {
    return await db.get(key)
  } catch (err) {
    return defaultValue
  }
}


/**
 * Update value of given key with result of supplied function.
 */
export const update = async (db, key, fn) => {
  if (!key) throw new Error('key undefined')
  const value = fn(await db.get(key))
  await db.put(key, value)
  return value
}
