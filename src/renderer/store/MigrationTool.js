import * as L from '../../shared/level'
import { hiddenId, lockedId, sharedId, tagsId } from '../ids'

/**
 * Upgrade/downgrade databases as necessary.
 */
export const MigrationTool = function (db, options) {
  this.schemaDB = L.schemaDB(db)
  this.jsonDB = L.jsonDB(db)
  this.options = options

  // ;(async () => {
  //   await this.schemaDB.put(INLINE_IDENTIFIERS, false)
  // })()

  console.log(options)
}

MigrationTool.REDUNDANT_IDENTIFIERS = 'redundantIdentifiers'
MigrationTool.INLINE_TAGS = 'inlineTags'
MigrationTool.INLINE_FLAGS = 'inlineFlags'

/**
 * async
 */
MigrationTool.prototype.upgrade = async function () {
  await this.redundantIdentifiers()
  await this.inlineTags()
  await this.inlineFlags()
}

/**
 *
 */
MigrationTool.prototype.redundantIdentifiers = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.REDUNDANT_IDENTIFIERS, true)
  const wanted = this.options[MigrationTool.REDUNDANT_IDENTIFIERS]

  const upgrade = async () => {
    const tuples = await L.readTuples(this.jsonDB, '')
    const ops = tuples
      .filter(([_, value]) => value.id)
      .map(([key, { id, ...value }]) => L.putOp(key, value))

    await this.jsonDB.batch(ops)
    await this.schemaDB.put(MigrationTool.REDUNDANT_IDENTIFIERS, false)
  }

  if (actual && wanted === false) await upgrade()
}

MigrationTool.prototype.inlineTags = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.INLINE_TAGS, true)
  const wanted = this.options[MigrationTool.INLINE_TAGS]

  const upgrade = async () => {
    const tuples = await L.readTuples(this.jsonDB, '')
    const ops = tuples
      .filter(([_, value]) => value.tags)
      .reduce((acc, [key, { tags, ...value }]) => {
        acc.push(L.putOp(key, value))
        acc.push(L.putOp(tagsId(key), tags))
        return acc
      }, [])

    await this.jsonDB.batch(ops)
    await this.schemaDB.put(MigrationTool.INLINE_TAGS, false)
  }

  if (actual && wanted === false) await upgrade()
}

MigrationTool.prototype.inlineFlags = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.INLINE_FLAGS, true)
  const wanted = this.options[MigrationTool.INLINE_FLAGS]

  const upgrade = async () => {
    const tuples = await L.readTuples(this.jsonDB, '')
    const ops = tuples
      .filter(([_, value]) => value.hidden || value.locked || value.shared)
      .reduce((acc, [key, { hidden, locked, shared, ...value }]) => {
        acc.push(L.putOp(key, value))
        if (hidden) acc.push(L.putOp(hiddenId(key), true))
        if (locked) acc.push(L.putOp(lockedId(key), true))
        if (shared) acc.push(L.putOp(sharedId(key), true))
        return acc
      }, [])

    await this.jsonDB.batch(ops)
    await this.schemaDB.put(MigrationTool.INLINE_FLAGS, false)
  }

  if (actual && wanted === false) await upgrade()
}
