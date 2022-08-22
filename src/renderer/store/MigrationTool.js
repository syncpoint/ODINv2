import * as L from '../../shared/level'
import * as ID from '../ids'

/**
 * Upgrade/downgrade databases as necessary.
 */
export default function MigrationTool (db, options) {
  this.schemaDB = L.schemaDB(db)
  this.jsonDB = L.jsonDB(db)
  this.options = options

  ;(async () => {
    // this.schemaDB.del(MigrationTool.DEFAULT_STYLE)
  })()
}

MigrationTool.REDUNDANT_IDENTIFIERS = 'redundantIdentifiers'
MigrationTool.INLINE_TAGS = 'inlineTags'
MigrationTool.INLINE_FLAGS = 'inlineFlags'
MigrationTool.DEFAULT_TAG = 'defaultTag'
MigrationTool.INLINE_STYLES = 'inlineStyles'
MigrationTool.DEFAULT_STYLE = 'defaultStyle'

/**
 * async
 */
MigrationTool.prototype.upgrade = async function () {
  await this.redundantIdentifiers()
  await this.inlineTags()
  await this.inlineFlags()
  await this.defaultTag()
  await this.inlineStyles()
  await this.defaultStyle()
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
        acc.push(L.putOp(ID.tagsId(key), tags))
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
        if (hidden) acc.push(L.putOp(ID.hiddenId(key), true))
        if (locked) acc.push(L.putOp(ID.lockedId(key), true))
        if (shared) acc.push(L.putOp(ID.sharedId(key), true))
        return acc
      }, [])

    await this.jsonDB.batch(ops)
    await this.schemaDB.put(MigrationTool.INLINE_FLAGS, false)
  }

  if (actual && wanted === false) await upgrade()
}

MigrationTool.prototype.defaultTag = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.DEFAULT_TAG, true)
  const wanted = this.options[MigrationTool.DEFAULT_TAG]

  const upgrade = async () => {
    const tuples = await L.tuples(this.jsonDB, 'tags+layer:')
    const tags = tuples.find(([_, value]) => value.includes('default'))
    if (!tags) return

    const [key, value] = tags
    const id = ID.associatedId(key)

    const ops = [
      L.putOp(key, value.filter(tag => tag !== 'default')),
      L.putOp(ID.defaultId(id), true)
    ]

    await this.jsonDB.batch(ops)
    await this.schemaDB.put(MigrationTool.DEFAULT_TAG, false)
  }

  if (actual && wanted === false) await upgrade()
}


/**
 *
 */
MigrationTool.prototype.inlineStyles = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.INLINE_STYLES, true)
  const wanted = this.options[MigrationTool.INLINE_STYLES]

  const upgrade = async () => {
    const tuples = await L.tuples(this.jsonDB, 'feature:')
    const ops = tuples
      .filter(([, value]) => value.properties?.style)
      .reduce((acc, [key, value]) => {
        const { style, ...properties } = value.properties
        acc.push(L.putOp(key, { ...value, properties }))
        acc.push(L.putOp(ID.styleId(key), style))
        return acc
      }, [])

    await this.jsonDB.batch(ops)
    await this.schemaDB.put(MigrationTool.INLINE_STYLES, false)
  }

  if (actual && wanted === false) await upgrade()
}


/**
 *
 */
MigrationTool.prototype.defaultStyle = async function () {
  const actual = await L.get(this.schemaDB, MigrationTool.DEFAULT_STYLE, false)
  const wanted = this.options[MigrationTool.DEFAULT_STYLE]

  const upgrade = async () => {
    console.log('upgrade/DEFAULT_STYLE')
    const ops = []
    const style = {
      'color-scheme': 'medium',
      'line-color': '#3399CC',
      'line-width': 1.25,
      'fill-color': '#3399CC',
      'line-smooth': false,
      'circle-radius': 5,
      'circle-line-color': '#3399CC',
      'circle-line-width': 1.25,
      'circle-fill-color': 'rgba(255,255,255,0.4)',
      'symbol-size': 60, // pixels
      'symbol-fill-opacity': 0.6,
      'symbol-halo-color': null, // only valid with symbol-halo-width = 0
      'symbol-halo-width': 0,
      'symbol-color': '', // default: '', `null` won't work
      'symbol-line-width': 2, // default: 3
      'symbol-text-color': 'black',
      'symbol-text-size': 40, // default: 40% of symbol-size
      'icon-scale': 0.5,
      // 'text-font-style': 'normal', // none, normal, italic, oblique
      // 'text-font-variant': 'normal', // none, normal, small-caps
      'text-font-weight': 'lighter', // none, normal, bold
      'text-font-size': '14px',
      'text-font-family': 'sans-serif', // sans-serif, roboto, monospace
      'text-color': '#A44',
      'text-halo-color': 'black',
      'text-halo-width': 0.5
    }

    ops.push(L.putOp('style+default', style))
    await this.jsonDB.batch(ops)
    await this.schemaDB.put(MigrationTool.DEFAULT_STYLE, true)
  }

  if (!actual && wanted === true) await upgrade()
}
