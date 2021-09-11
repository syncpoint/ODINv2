import levelup from 'levelup'
import leveldown from 'leveldown'
import sublevel from 'subleveldown'
import encode from 'encoding-down'
import { wkb } from './encoding'


/**
 * Plain persistent tuple store (values encoded as Buffer).
 *
 * @param {String} location parent database directory
 */
export const plainStore = location => levelup(leveldown(location))


/**
 * Persistent tuple store with JSON-encoded values.
 * @param {*} location location parent database directory
 */
export const jsonStore = location => levelup(encode(leveldown(location), { valueEncoding: 'json' }))


/**
 * JSON-encoded 'tuples' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const propertiesPartition = db => sublevel(db, 'tuples', { valueEncoding: 'json' })


/**
 * WKB-encoded 'geometries' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const geometryPartition = db => sublevel(db, 'geometries', wkb)


/**
 * JSON-encoded 'preferences' partition on top of plain store.
 * @param {*} db plain store without explicit encoding.
 */
export const preferencesPartition = db => sublevel(db, 'tuples', { valueEncoding: 'json' })
