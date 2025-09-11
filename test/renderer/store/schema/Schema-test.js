import assert from 'assert'
import * as R from 'ramda'
import * as L from '../../../../src/shared/level'
import Schema from '../../../../src/renderer/store/schema/Schema'
import options from '../../../../src/renderer/store/schema/fixtures'

const createSchemaDB = async (db, kvs = []) => {
  const schema = L.schemaDB(db)
  const ops = R.compose(
    R.map(([k, v]) => L.putOp(k, v)),
    R.filter(([k, v]) => !R.isNil(v))
  )(kvs)

  await schema.batch(ops)
  return schema
}

const createJsonDB = async (db, kvs = []) => {
  const json = L.jsonDB(db)
  const ops = R.map(([k, v]) => L.putOp(k, v), kvs)
  await json.batch(ops)
  return json
}

const translations = [
  ['redundantIdentifiers', true, 'ids', 'VALUE'],
  ['redundantIdentifiers', false, 'ids', 'KEY-ONLY'],
  ['inlineTags', true, 'tags', 'INLINE'],
  ['inlineTags', false, 'tags', 'SEPARATE'],
  ['inlineFlags', true, 'flags', 'INLINE'],
  ['inlineFlags', false, 'flags', 'SEPARATE'],
  ['defaultTag', true, 'default-tag', 'TAGS'],
  ['defaultTag', false, 'default-tag', 'SEPARATE'],
  ['inlineStyles', true, 'styles', 'PROPERTIES'],
  ['inlineStyles', false, 'styles', 'SEPARATE']
]

describe('Schema', function () {
  translations.forEach(fixture => {
    const [oldKey, oldValue, newKey, newValue] = fixture
    it(`translate [${oldKey}/${oldValue}]`, async function () {
      const db = L.leveldb()
      const schemaDB = await createSchemaDB(db, [[oldKey, oldValue]])
      const schema = new Schema(db, {})
      await schema.bootstrap()
      const actualValue = await L.get(schemaDB, newKey)
      assert.equal(actualValue, newValue)
    })
  })

  options.forEach(options => {
    it(`${options.id} [${options.actual} -> ${options.wanted}]`, async function () {
      const { id, actual, wanted } = options
      const { initial, expected } = options
      const db = L.leveldb()
      const schemaDB = await createSchemaDB(db, [[id, actual]])
      const jsonDB = await createJsonDB(db, initial)
      const schema = new Schema(db, { [id]: wanted })
      await schema.bootstrap()
      assert.equal(await L.get(schemaDB, id), wanted)
      assert.deepStrictEqual(await L.tuples(jsonDB), expected)
    })
  })
})
