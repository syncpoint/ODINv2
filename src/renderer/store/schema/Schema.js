import * as L from '../../../shared/level'
import ids from './ids'
import tags from './tags'
import flags from './flags'
import defaultTag from './default-tag'
import styles from './styles'
import ms2525c from './ms2525c'
import skkm from './skkm'
import defaultStyle from './default-style'

/**
 * Verify that data organization/structure in project database
 * is compatible with current software version.
 */

/**
 * To make things a little more interesting, we also changed how
 * the state of the current configuration is stored in schema database.
 * First we have to translate to new keys and values if necessary,
 */


const features = {
  ids: [ids, 'VALUE', 'KEY-ONLY'],
  tags: [tags, 'INLINE', 'SEPARATE'],
  flags: [flags, 'INLINE', 'SEPARATE'],
  'default-tag': [defaultTag, 'TAGS', 'SEPARATE'],
  styles: [styles, 'PROPERTIES', 'SEPARATE'],
  ms2525c: [ms2525c, 'UNLOADED', 'LOADED'],
  skkm: [skkm, 'UNLOADED', 'LOADED'],
  'default-style': [defaultStyle, 'UNLOADED', 'LOADED']
}

const value = (id, x) => features[id][1 + (x ? 0 : 1)]

const translations = {
  redundantIdentifiers: 'ids',
  inlineTags: 'tags',
  inlineFlags: 'flags',
  defaultTag: 'default-tag',
  inlineStyles: 'styles'
}

export default function Schema (db, options) {
  this.schemaDB = L.schemaDB(db)
  this.jsonDB = L.jsonDB(db)
  this.options = options
}


/**
 *
 */
Schema.prototype.bootstrap = async function () {
  await this.translate()

  // Check current and wanted configurations;
  // upgrade/downgrade as necessary.
  const ps = Object.entries(features).map(async ([id, feature]) => {
    const actual = await L.get(this.schemaDB, id, feature[1])
    const wanted = this.options[id]

    if (wanted === undefined) return
    if (actual === wanted) return

    await feature[0][wanted](this.jsonDB)
    await this.schemaDB.put(id, wanted)
  })

  return await Promise.all(ps)
}


/**
 *
 */
Schema.prototype.translate = async function () {
  // For some reason `getMany()` never resolves on
  // database with status 'opening'.
  // Waiting one tick seems to fix this problem.
  // NOTE: This is only an issue for unit tests.

  if (this.schemaDB.status === 'opening') {
    return new Promise(resolve => {
      setImmediate(async () => {
        await this.translate()
        resolve()
      })
    })
  }

  // Translate and delete any old keys in schema database.
  const tuples = await L.tuples(this.schemaDB, Object.keys(translations))

  const ops = tuples
    .map(([ko, vo]) => [ko, vo, translations[ko]])
    .map(([ko, ov, kn]) => [ko, kn, value(kn, ov)])
    .flatMap(([ko, kn, vn]) => [L.delOp(ko), L.putOp(kn, vn)])

  await this.schemaDB.batch(ops)
}
