import * as R from 'ramda'
import * as L from '../../shared/level'
import * as ID from '../ids'


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

  const downgrade = async () => {
    // TODO: limit to scopes originally carrying ids in values
    const tuples = await L.readTuples(this.jsonDB, '')
    const ops = tuples
      .map(([key, value]) => L.putOp(key, { ...value, id: key }))

    await this.jsonDB.batch(ops)
    await this.schemaDB.put(MigrationTool.REDUNDANT_IDENTIFIERS, true)
  }

  if (actual && wanted === false) await upgrade()
  else if (actual === false && wanted === true) await downgrade()
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

  const downgrade = async () => {
    const tags = await L.tuples(this.jsonDB, 'tags+')
    const ids = tags.map(([k]) => ID.dropScope(k))
    const oldValues = await L.values(this.jsonDB, ids)
    const newValues = R.zip(tags, oldValues).map(([[_, tags], v]) => ({ ...v, tags }))
    await L.mput(this.jsonDB, R.zip(ids, newValues))
    await L.mdel(this.jsonDB, tags.map(R.prop(0)))
    await this.schemaDB.put(MigrationTool.INLINE_TAGS, true)
  }

  if (actual && wanted === false) await upgrade()
  else if (actual === false && wanted === true) await downgrade()
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

  const downgrade = async () => {
    const hidden = await L.keys(this.jsonDB, 'hidden+')
    const locked = await L.keys(this.jsonDB, 'locked+')
    const shared = await L.keys(this.jsonDB, 'shared+')
    const all = [].concat(hidden, locked, shared)

    const entities = all.reduce((acc, key) => {
      const [scope, id] = key.split('+')
      acc[id] = acc[id] || {}
      acc[id][scope] = true
      return acc
    }, {})

    const keys = Object.keys(entities)
    const tuples = await L.mgetTuples(this.jsonDB, keys)
    const kv = tuples.map(([k, v]) => [k, { ...v, ...entities[k] }])

    const ops = [
      ...all.map(L.delOp),
      ...kv.map(([k, v]) => L.putOp(k, v))
    ]

    await this.jsonDB.batch(ops)
    await this.schemaDB.put(MigrationTool.INLINE_FLAGS, true)
  }

  if (actual && wanted === false) await upgrade()
  else if (actual === false && wanted === true) await downgrade()
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

  const downgrade = async () => {
    const keys = await L.keys(this.jsonDB, 'default+layer:')
    if (keys.length === 1) {
      const key = ID.dropScope(keys[0])
      const tags = await L.get(this.jsonDB, ID.tagsId(key))
      const ops = [
        L.delOp(keys[0]),
        L.putOp(ID.tagsId(key), [...tags, 'default'])
      ]

      await this.jsonDB.batch(ops)
    }

    await this.schemaDB.put(MigrationTool.DEFAULT_TAG, true)
  }

  if (actual && wanted === false) await upgrade()
  else if (actual === false && wanted === true) await downgrade()
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

  const downgrade = async () => {
    const tuples = await L.tuples(this.jsonDB, 'style+feature:')
    const keys = tuples.map(([k]) => ID.dropScope(k))
    const styles = tuples.map(R.prop(1))
    const oldValues = await L.tuples(this.jsonDB, keys)

    const value = ({ properties, ...rest }, style) => ({
      ...rest,
      properties: {
        ...properties,
        style
      }
    })

    const newValues = R.zip(styles, oldValues).map(([style, [k, v]]) => [k, value(v, style)])
    const ops = [
      ...tuples.map(([k]) => L.delOp(k)),
      ...newValues.map(([k, v]) => L.putOp(k, v))
    ]

    await this.jsonDB.batch(ops)
    await this.schemaDB.put(MigrationTool.INLINE_STYLES, true)
  }

  if (actual && wanted === false) await upgrade()
  else if (actual === false && wanted === true) await downgrade()
}
