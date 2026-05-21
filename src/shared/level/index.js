import * as R from 'ramda'
import { ClassicLevel } from 'classic-level'
import { MemoryLevel } from 'memory-level'
import { wkb } from './wkb'

// Value encodings accepted via the `encoding` factory option.
const valueEncodings = {
  wkb,
  json: 'json'
}

/**
 * leveldb :: Options -> AbstractLevel
 */
export const leveldb = (options = {}) => {
  const valueEncoding = valueEncodings[options.encoding]
  const dbOptions = valueEncoding ? { valueEncoding } : {}

  if (options.parent) return options.parent.sublevel(options.prefix, dbOptions)

  return options.location
    ? new ClassicLevel(options.location, dbOptions)
    : new MemoryLevel(dbOptions)
}


/**
 * JSON-encoded 'tuples' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const jsonDB = db => leveldb({ parent: db, encoding: 'json', prefix: 'tuples' })


/**
 * WKB-encoded 'geometries' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const wkbDB = db => leveldb({ parent: db, encoding: 'wkb', prefix: 'geometries' })


/**
 * JSON-encoded 'preferences' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const preferencesDB = db => db.sublevel('preferences', { valueEncoding: 'json' })


/**
 * JSON-encoded 'session' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const sessionDB = db => db.sublevel('session', { valueEncoding: 'json' })


/**
 * JSON-encoded 'schema' partition on top of plain store.
 * Holds database schema options for upgrading/downgrading schema between versions.
 * @param {*} db plain store without explicit encoding.
 */
export const schemaDB = db => db.sublevel('schema', { valueEncoding: 'json' })


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
 * collect :: (AsyncIterable a, a -> b) -> Promise [b]
 */
const collect = async (iterable, decode) => {
  const acc = []
  for await (const item of iterable) acc.push(decode(item))
  return acc
}

export const Decoders = {
  TUPLE: ([key, value]) => [key, value],
  ENTITY: ([key, value]) => ({ id: key, ...value })
}

export const readTuples = (db, options) => collect(db.iterator(options), Decoders.TUPLE)
export const readEntities = (db, options) => collect(db.iterator(options), Decoders.ENTITY)
export const readKeys = (db, options) => collect(db.keys(options), R.identity)
export const readValues = (db, options) => collect(db.values(options), R.identity)

/**
 * mget :: fn -> (db, [k]) -> [fn(k, v)]
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
 * mgetTuples :: (db, [k]) -> [[k, v]]
 */
export const mgetTuples = mget((key, value) => [key, value])

/**
 * mgetKeys :: (db, [k]) -> [k]
 */
export const mgetKeys = mget((key, _) => key)

/**
 * mgetValues :: (db, [k]) -> [v]
 */
export const mgetValues = defaultValue => mget((_, value) => value, defaultValue)

/**
 * mgetEntities :: (db, [k]) -> [{id: k, ...v}]
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
 * values :: db -> [k] -> [v]
 * values :: db -> String -> [v]
 */
export const values = (db, arg, defaultValue) => Array.isArray(arg)
  ? mgetValues(defaultValue)(db, arg)
  : readValues(db, prefix(arg))

/**
 * existsKey :: db -> {gte, lte} -> Boolean
 */
export const existsKey = async (db, range) => {
  const found = await collect(db.keys({ ...range, limit: 1 }), R.identity)
  return found.length > 0
}

/**
 * get :: db -> k -> v
 * get :: db -> k -> v -> v
 *
 * Get value for given key with optional default value if key was not found.
 * abstract-level returns `undefined` for a missing key; PartitionStore and the
 * IPC client may reject — both are treated as "not found".
 */
export const get = async (db, key, value) => {
  let result
  try {
    result = await db.get(key)
  } catch (err) {
    result = undefined
  }

  if (result !== undefined) return result
  if (typeof value === 'undefined') throw new Error(`key not found: ${key}`)
  return value
}

/**
 * mput :: db -> (k, v) -> unit
 * mput :: db -> {k: v} -> unit
 * mput :: db -> [[k, v]] -> unit
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
 * mdel :: db -> [k] -> unit
 */
export const mdel = async (db, arg) => {
  if (Array.isArray(arg)) return db.batch(arg.map(key => delOp(key)))
  else return mdel(db, await readKeys(db, prefix(arg)))
}

/**
 * tap :: db -> k -> (v -> v) -> unit
 */
export const tap = async function (db, key, fn) {
  const value = await db.get(key)
  return db.put(key, fn(value))
}
