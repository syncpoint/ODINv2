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
export const propertiesPartition = db => leveldb({ up: db, encoding: 'json', prefix: 'tuples' })


/**
 * WKB-encoded 'geometries' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const geometriesPartition = db => leveldb({ up: db, encoding: 'wkb', prefix: 'geometries' })


/**
 * JSON-encoded 'preferences' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const preferencesPartition = db => sublevel(db, 'preferences', { valueEncoding: 'json' })
