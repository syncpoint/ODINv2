import * as R from 'ramda'
import levelup from 'levelup'
import leveldown from 'leveldown'
import memdown from 'memdown'
import sublevel from 'subleveldown'
import encode from 'encoding-down'
import { wkb } from './wkb'

const encodings = {
  json: { valueEncoding: 'json' },
  wkb: wkb
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
export const wbkDB = db => leveldb({ up: db, encoding: 'wkb', prefix: 'geometries' })


/**
 * JSON-encoded 'preferences' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const preferencesPartition = db => sublevel(db, 'preferences', { valueEncoding: 'json' })

export const prefix = prefix => ({ gte: `${prefix}`, lte: `${prefix}\xff` })
export const putOp = (key, value) => ({ type: 'put', key, value })
export const deleteOp = key => ({ type: 'del', key })

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
 * mget :: fn => (levelup, [k]) => [fn(k, v)]
 */
export const mget = decode => async (db, keys) => {
  const values = await db.getMany(keys)
  return keys.reduce((acc, key, index) => {
    const value = values[index]
    if (value !== undefined) acc.push(decode(key, value))
    return acc
  }, [])
}

export const mgetTuples = mget((key, value) => [key, value])
export const mgetKeys = mget((key, _) => key)
export const mgetValues = mget((_, value) => value)
export const mgetEntities = mget((key, value) => ({ id: key, ...value }))

/**
 * tuples :: [k] -> [[k, v]]
 * tuples :: String -> [[k, v]]
 */
export const tuples = (db, arg) => Array.isArray(arg)
  ? mgetTuples(db, arg)
  : readTuples(db, prefix(arg))

/**
 * values :: [k] -> [v]
 * values :: String -> [v]
 */
export const values = (db, arg) => Array.isArray(arg)
  ? mgetValues(db, arg)
  : readValues(db, prefix(arg))
