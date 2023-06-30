import * as R from 'ramda'
import levelup from 'levelup'
import leveldown from 'leveldown'
import memdown from 'memdown'
import sublevel from 'subleveldown'
import encode from 'encoding-down'
import { wkb } from './wkb'

const encodings = {
  wkb,
  json: { valueEncoding: 'json' }
}

export const leveldb = (options = {}) => {
  const encoding = encodings[options.encoding]
  if (options.down) return levelup(options.down)
  else if (options.up) return sublevel(options.up, options.prefix, encoding)
  else {
    const down = options.location ? leveldown(options.location) : memdown()
    const encoded = encoding ? encode(down, encoding) : down
    return leveldb({ down: encoded })
  }
}


/**
 * JSON-encoded 'tuples' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const jsonDB = db => leveldb({ up: db, encoding: 'json', prefix: 'tuples' })


/**
 * WKB-encoded 'geometries' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const wkbDB = db => leveldb({ up: db, encoding: 'wkb', prefix: 'geometries' })


/**
 * JSON-encoded 'preferences' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const preferencesDB = db => sublevel(db, 'preferences', { valueEncoding: 'json' })


/**
 * JSON-encoded 'session' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const sessionDB = db => sublevel(db, 'session', { valueEncoding: 'json' })


/**
 * JSON-encoded 'schema' partition on top of plain store.
 * Holds database schema options for upgrading/downgrading schema between versions.
 * @param {*} db plain store without explicit encoding.
 */
export const schemaDB = db => sublevel(db, 'schema', { valueEncoding: 'json' })


/**
 * prefix :: String -> {gte, lte}
 */
export const prefix = prefix => ({ gte: `${prefix}`, lte: `${prefix}\xff` })

/**
 * putOp :: (k, v) -> {type: 'put', key: k, value: v}
 */
export const putOp = (key, value) => ({ type: 'put', key, value })

/**
 * delOp :: k -> {type: 'del', key: k}
 */
export const delOp = key => ({ type: 'del', key })

/**
 * read :: (stream, fn) -> [fn(k, v)]
 */
export const read = (stream, decode) => new Promise((resolve, reject) => {
  const acc = []
  stream
    .on('data', data => acc.push(decode(data)))
    .on('error', reject)
    .on('close', () => resolve(acc))
})

export const Decoders = {
  TUPLE: ({ key, value }) => [key, value],
  ENTITY: ({ key, value }) => ({ id: key, ...value })
}

export const readStream = (db, options) => db.createReadStream(options)

export const Streams = {
  TUPLE: (db, options) => readStream(db, { ...options, keys: true, values: true }),
  VALUE: (db, options) => readStream(db, { ...options, keys: false, values: true }),
  KEY: (db, options) => readStream(db, { ...options, keys: true, values: false })
}

export const readTuples = (db, options) => read(Streams.TUPLE(db, options), Decoders.TUPLE)
export const readEntities = (db, options) => read(Streams.TUPLE(db, options), Decoders.ENTITY)
export const readKeys = (db, options) => read(Streams.KEY(db, options), R.identity)
export const readValues = (db, options) => read(Streams.VALUE(db, options), R.identity)

/**
 * mget :: fn -> (levelup, [k]) -> [fn(k, v)]
 */
export const mget = (decode, defaultValue) => async (db, keys) => {
  const values = await db.getMany(keys)
  const applyDefaultValue = value => value !== undefined
    ? value
    : defaultValue !== null
      ? defaultValue
      : undefined

  return R.zip(keys, values)
    .map(([key, value]) => [key, applyDefaultValue(value)])
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => decode(key, value))
}

/**
 * mgetTuples :: (levelup, [k]) -> [[k, v]]
 */
export const mgetTuples = mget((key, value) => [key, value])

/**
 * mgetKeys :: (levelup, [k]) -> [k]
 */
export const mgetKeys = mget((key, _) => key)

/**
 * mgetKeys :: (levelup, [k]) -> [v]
 */
export const mgetValues = defaultValue => mget((_, value) => value, defaultValue)

/**
 * mgetEntities :: (levelup, [k]) -> [{id: k, ...v}]
 */
export const mgetEntities = mget((key, value) => ({ id: key, ...value }))

/**
 * tuples :: [k] -> [[k, v]]
 * tuples :: String -> [[k, v]]
 */
export const tuples = (db, arg) => Array.isArray(arg)
  ? mgetTuples(db, arg)
  : arg
    ? readTuples(db, prefix(arg))
    : readTuples(db, {})

/**
 * keys :: [k] -> [k]
 * keys :: String -> [k]
 */
export const keys = (db, arg) => Array.isArray(arg)
  ? mgetKeys(db, arg)
  : arg
    ? readKeys(db, prefix(arg))
    : readKeys(db, {})

/**
 * values :: levelup -> [k] -> [v]
 * values :: levelup -> String -> [v]
 */
export const values = (db, arg, defaultValue) => Array.isArray(arg)
  ? mgetValues(defaultValue)(db, arg)
  : readValues(db, prefix(arg))

/**
 * existsKey :: levelup -> String -> Boolean
 */
export const existsKey = (db, prefix) => new Promise((resolve, reject) => {
  db.createReadStream({ keys: true, values: false, limit: 1, ...prefix })
    .on('data', () => resolve(true))
    .on('error', reject)
    .on('close', () => resolve(false))
})

/**
 * get :: levelup -> k -> v
 * get :: levelup -> k -> v -> v
 *
 * Get value for given key with optional default value if key was not found.
 */
export const get = async (db, key, value) => {
  try {
    return await db.get(key)
  } catch (err) {
    if (typeof value === 'undefined') throw err
    else return value
  }
}

/**
 * put :: levelup -> (k, v) -> unit
 * put :: levelup -> {k: v} -> unit
 * put :: levelup -> [[k, v]] -> unit
 */
export const mput = (db, ...args) => {
  if (args.length === 2) return db.put(args[0], args[1]) // key/value
  else if (args.length === 1) {
    const ops = xs => xs.map(([key, value]) => putOp(key, value))
    const batch = Array.isArray(args[0])
      ? ops(args[0]) // [[k, v]]
      : ops(Object.entries(args[0])) // {k: v}

    return db.batch(batch)
  }
}

/**
 * mdel :: levelup -> [k] -> unit
 */
export const mdel = async (db, arg) => {
  if (Array.isArray(arg)) return db.batch(arg.map(key => delOp(key)))
  else return mdel(db, await readKeys(db, prefix(arg)))
}

/**
 * tap :: levelup -> k -> (v -> v) -> unit
 */
export const tap = async function (db, key, fn) {
  const value = await db.get(key)
  return db.put(key, fn(value))
}
