import * as L from '../../../shared/level'
import ids from './ids'

/**
 * Verify that data organization/structure in project database
 * is compatible with current software version.
 */

/**
 * To make things a little more interesting, we also changed how
 * the state of the current configuration is stored in schema database.
 * First we have to translate to new keys and values if necessary,
 */

const translations = {
  redundantIdentifiers: ['ids', x => x ? 'VALUE' : 'KEY-ONLY'],
  inlineTags: ['tags', x => x ? 'INLINE' : 'SEPARATE'],
  inlineFlags: ['flags', x => x ? 'INLINE' : 'SEPARATE'],
  defaultTag: ['default-tag', x => x ? 'TAGS' : 'SEPARATE'],
  inlineStyles: ['styles', x => x ? 'PROPERTIES' : 'SEPARATE' ]
}

const configurations = {
  ids: ['KEY-ONLY', ids]
}


export default function Schema (db) {
  this.schemaDB = L.schemaDB(db)
  this.jsonDB = L.jsonDB(db)
}

Schema.prototype.bootstrap = async function () {
  await this.translate()

  // Check current and wanted configurations;
  // upgrade/downgrade as necessary,
}

Schema.prototype.translate = async function () {
  // For some reason getMany() never resolves on
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

  const ops = tuples.flatMap(([key, value]) => [
    L.delOp(key),
    L.putOp(translations[key][0], translations[key][1](value))
  ])

  await this.schemaDB.batch(ops)
}
