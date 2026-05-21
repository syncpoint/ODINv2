import assert from 'assert'
import { PartitionDOWN } from '../../../src/shared/level/PartitionDOWN'
import { leveldb, jsonDB, wkbDB } from '../../../src/shared/level'

const createdb = () => {
  const db = leveldb({})
  return new PartitionDOWN(jsonDB(db), wkbDB(db))
}

// One sample per routing case: properties-only, geometry-only and split.
const samples = [
  ['a string', 'value'],
  ['a number', 0],
  ['a geometry', { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] }],
  ['a feature without geometry', {
    type: 'Feature',
    name: 'PzGrenKp Lipsch',
    properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
  }],
  ['a feature with geometry', {
    type: 'Feature',
    name: 'PzGrenKp Lipsch',
    geometry: { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] },
    properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
  }]
]

describe('PartitionDOWN', function () {

  describe('argument validation', function () {
    it('get rejects a null/undefined key', async function () {
      await assert.rejects(() => createdb().get(null), /key cannot be/)
      await assert.rejects(() => createdb().get(undefined), /key cannot be/)
    })

    it('put rejects a null/undefined key', async function () {
      await assert.rejects(() => createdb().put(null, 'value'), /key cannot be/)
      await assert.rejects(() => createdb().put(undefined, 'value'), /key cannot be/)
    })

    it('put rejects a null/undefined value', async function () {
      await assert.rejects(() => createdb().put('key', null), /value cannot be/)
      await assert.rejects(() => createdb().put('key', undefined), /value cannot be/)
    })

    it('del rejects a null/undefined key', async function () {
      await assert.rejects(() => createdb().del(null), /key cannot be/)
      await assert.rejects(() => createdb().del(undefined), /key cannot be/)
    })

    it('batch rejects a non-array argument', async function () {
      for (const arg of [undefined, '', 0, {}]) {
        await assert.rejects(() => createdb().batch(arg), /requires an array argument/)
      }
    })
  })

  samples.forEach(([description, value]) => {
    it(`put/get round-trips ${description}`, async function () {
      const db = createdb()
      await db.put('key', value)
      assert.deepStrictEqual(await db.get('key'), value)
    })

    it(`put/del removes ${description}`, async function () {
      const db = createdb()
      await db.put('key', value)
      await db.del('key')
      assert.strictEqual(await db.get('key'), undefined)
    })

    it(`batch put/get round-trips ${description}`, async function () {
      const db = createdb()
      await db.batch([{ type: 'put', key: 'key', value }])
      assert.deepStrictEqual(await db.get('key'), value)
    })

    it(`batch del removes ${description}`, async function () {
      const db = createdb()
      await db.batch([{ type: 'put', key: 'key', value }])
      await db.batch([{ type: 'del', key: 'key' }])
      assert.deepStrictEqual(await db.getMany(['key']), [undefined])
    })
  })

  it('iterator merges both partitions in key order', async function () {
    const db = createdb()
    const entries = samples.map(([, value], i) => [`key:${100 + i}`, value])
    await db.batch(entries.map(([key, value]) => ({ type: 'put', key, value })))

    const acc = []
    for await (const entry of db.iterator({})) acc.push(entry)
    assert.deepStrictEqual(acc, entries)
  })

  it('getMany reconstructs values for multiple keys', async function () {
    const db = createdb()
    const entries = samples.map(([, value], i) => [`key:${100 + i}`, value])
    await db.batch(entries.map(([key, value]) => ({ type: 'put', key, value })))

    const actual = await db.getMany(entries.map(([key]) => key))
    assert.deepStrictEqual(actual, entries.map(([, value]) => value))
  })
})
