import assert from 'assert'
import * as R from 'ramda'
import MigrationTool from './MigrationTool'
import * as L from '../../shared/level'


const schemaDB = async (db, kv = {}) => {
  const schema = L.schemaDB(db)
  const ops = R.compose(
    R.map(([k, v]) => L.putOp(k, v)),
    Object.entries
  )(kv)

  await schema.batch(ops)
  return schema
}

const jsonDB = async (db, kv = {}) => {
  const json = L.jsonDB(db)
  const ops = R.compose(
    R.map(([k, v]) => L.putOp(k, v)),
    Object.entries
  )(kv)

  await json.batch(ops)
  return json
}

describe.only('MigrationTool', function () {
  it('ids [VALUE -> KEY-ONLY]', async function () {
    const db = L.leveldb()
    const schema = await schemaDB(db)
    const json = await jsonDB(db, {
      key: { value: 'a', id: 'key' }
    })

    const tools = new MigrationTool(db, {
      [MigrationTool.REDUNDANT_IDENTIFIERS]: false
    })

    await tools.bootstrap()
    assert.equal(await L.get(schema, 'redundantIdentifiers'), false)
    assert.deepStrictEqual(await L.get(json, 'key'), { value: 'a' })
  })

  it('ids [KEY-ONLY -> VALUE]', async function () {
    const db = L.leveldb()
    const schema = await schemaDB(db, { redundantIdentifiers: false })
    const json = await jsonDB(db, {
      key: { value: 'a', id: 'key' }
    })

    const tools = new MigrationTool(db, {
      [MigrationTool.REDUNDANT_IDENTIFIERS]: true
    })

    await tools.bootstrap()
    assert.equal(await L.get(schema, 'redundantIdentifiers'), true)
    assert.deepStrictEqual(await L.get(json, 'key'), { value: 'a', id: 'key' })
  })
})
