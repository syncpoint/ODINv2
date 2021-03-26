import assert from 'assert'
import level from 'level-mem'
import * as L from '../../src/shared/level'

describe('level', function () {
  let db
  const expectedA = [{ key: 'A:001', value: 'A:001-V' }, { key: 'A:002', value: 'A:002-V' }]
  const expectedB = [{ key: 'B:001', value: 'B:001-V' }]
  const expected = [...expectedA, ...expectedB]

  beforeEach(async function () {
    db = level()
    await expected.reduce((acc, entry) => {
      acc.put(entry.key, entry.value)
      return acc
    }, db.batch()).write()
  })

  it('#entries', async function () {
    assert.deepStrictEqual(await L.entries(db), expected)
    assert.deepStrictEqual(await L.entries(db, 'A:'), expectedA)
    assert.deepStrictEqual(await L.entries(db, 'B:'), expectedB)
  })

  it('#values', async function () {
    assert.deepStrictEqual(await L.values(db), expected.map(entry => entry.value))
    assert.deepStrictEqual(await L.values(db, 'A:'), expectedA.map(entry => entry.value))
    assert.deepStrictEqual(await L.values(db, 'B:'), expectedB.map(entry => entry.value))
  })

  it('#keys', async function () {
    assert.deepStrictEqual(await L.keys(db), expected.map(entry => entry.key))
    assert.deepStrictEqual(await L.keys(db, 'A:'), expectedA.map(entry => entry.key))
    assert.deepStrictEqual(await L.keys(db, 'B:'), expectedB.map(entry => entry.key))
  })

  it('#get', async function () {
    await db.put('key', 'value')
    assert.strictEqual(await L.get(db, 'key'), 'value')
    assert.strictEqual(await L.get(db, 'fantasy', 'default'), 'default')
  })
})
