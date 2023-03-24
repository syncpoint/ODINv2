import * as L from '../../shared/level'
import ids from './schema/ids'
import tags from './schema/tags'
import flags from './schema/flags'
import defaultTag from './schema/default-tag'
import styles from './schema/styles'


/**
 * Upgrade/downgrade databases as necessary.
 * TODO: provided already configured schemaDB, jsonDB instances
 */
export default function MigrationTool (db, options) {
  this.schemaDB = L.schemaDB(db)
  this.jsonDB = L.jsonDB(db)
  this.options = options
}

MigrationTool.REDUNDANT_IDENTIFIERS = 'redundantIdentifiers' // TODO: ids: VALUE | KEY-ONLY
MigrationTool.INLINE_TAGS = 'inlineTags' // TODO: tags : INLINE | SEPARATE
MigrationTool.INLINE_FLAGS = 'inlineFlags' // TODO: flags : INLINE | SEPARATE
MigrationTool.DEFAULT_TAG = 'defaultTag' // TODO: default-tag : INLINE | SEPARATE
MigrationTool.INLINE_STYLES = 'inlineStyles' // TODO: styles: INLINE | SEPARATE

/**
 * async
 */
MigrationTool.prototype.bootstrap = async function () {
  await this.redundantIdentifiers()
  await this.inlineTags()
  await this.inlineFlags()
  await this.defaultTag()
  await this.inlineStyles()

  // const ps = Object.entries(configurations).map(async ([id, config]) => {
  //   const { wanted, fns, key } = config
  //   const actual = await L.get(this.schemaDB, id, true)
  //   // const wanted = this.options[MigrationTool.REDUNDANT_IDENTIFIERS]
  //   if (key(actual) === wanted) return
  //   await fns[wanted](this.jsonDB)
  //   await this.schemaDB.put(id, wanted)
  // })

}

/**
 *
 */
MigrationTool.prototype.redundantIdentifiers = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.REDUNDANT_IDENTIFIERS, true)
  const wanted = this.options[MigrationTool.REDUNDANT_IDENTIFIERS]

  if (wanted === undefined) return
  if (actual === wanted) return

  const key = wanted ? 'VALUE' : 'KEY-ONLY'
  await ids[key](this.jsonDB)
  await this.schemaDB.put(MigrationTool.REDUNDANT_IDENTIFIERS, wanted)
}

MigrationTool.prototype.inlineTags = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.INLINE_TAGS, true)
  const wanted = this.options[MigrationTool.INLINE_TAGS]

  if (wanted === undefined) return
  if (actual === wanted) return

  const key = wanted ? 'INLINE' : 'SEPARATE'
  await tags[key](this.jsonDB)
  await this.schemaDB.put(MigrationTool.INLINE_TAGS, wanted)
}

MigrationTool.prototype.inlineFlags = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.INLINE_FLAGS, true)
  const wanted = this.options[MigrationTool.INLINE_FLAGS]

  if (wanted === undefined) return
  if (actual === wanted) return

  const key = wanted ? 'INLINE' : 'SEPARATE'
  await flags[key](this.jsonDB)
  await this.schemaDB.put(MigrationTool.INLINE_FLAGS, wanted)
}

MigrationTool.prototype.defaultTag = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.DEFAULT_TAG, true)
  const wanted = this.options[MigrationTool.DEFAULT_TAG]

  if (wanted === undefined) return
  if (actual === wanted) return

  const key = wanted ? 'TAGS' : 'SEPARATE'
  await defaultTag[key](this.jsonDB)
  await this.schemaDB.put(MigrationTool.DEFAULT_TAG, wanted)
}


/**
 *
 */
MigrationTool.prototype.inlineStyles = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.INLINE_STYLES, true)
  const wanted = this.options[MigrationTool.INLINE_STYLES]

  if (wanted === undefined) return
  if (actual === wanted) return

  const key = wanted ? 'PROPERTIES' : 'SEPARATE'
  await styles[key](this.jsonDB)
  await this.schemaDB.put(MigrationTool.INLINE_STYLES, wanted)
}
