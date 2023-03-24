import assert from 'assert'
import * as R from 'ramda'
import * as L from '../../../shared/level'
import Schema from './Schema'

const fixtures = [
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

const createSchemaDB = async (db, kvs = []) => {
  const schema = L.schemaDB(db)
  const ops = R.compose(
    R.map(([k, v]) => L.putOp(k, v)),
    R.filter(([k, v]) => !R.isNil(v))
  )(kvs)

  await schema.batch(ops)
  return schema
}

describe.only('Schema', function () {
  this.timeout(5000)
  fixtures.forEach(fixture => {
    const [oldKey, oldValue, newKey, newValue] = fixture
    it(`translate [${oldKey}/${oldValue}]`, async function () {
      const db = L.leveldb()
      const schemaDB = await createSchemaDB(db, [[oldKey, oldValue]])
      // console.log(schemaDB)
      // process.exit(0)
      // schemaDB.getMany(keys).then(xs => console.log(xs)).catch(err => console.error(err))
      const schema = new Schema(db)
      await schema.bootstrap()
      const actualValue = await L.get(schemaDB, newKey)
      assert.equal(actualValue, newValue)
    })
  })
})
