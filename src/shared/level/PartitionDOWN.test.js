import assert from 'assert'
import * as R from 'ramda'
import { PartitionDOWN } from './PartitionDOWN'
import { leveldb, propertiesPartition, geometriesPartition } from '.'

describe('PartitionDOWN', function () {

  const feature = {
    type: 'Feature',
    id: 'feature:95edaaad-3ba5-4148-9e15-c658387489f7/64d8074b-f6ee-47c1-bc97-c7a9451a56fb',
    name: 'PzGrenKp Lipsch',
    geometry: { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] },
    properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
  }

  const createdb = () => {
    const db = leveldb({})
    const propertiesLevel = propertiesPartition(db)
    const geometriesLevel = geometriesPartition(db)
    const down = new PartitionDOWN(propertiesLevel, geometriesLevel)
    return leveldb({ down })
  }

  it('put/get [other]', async function () {
    const db = createdb()
    await db.put('hello', 'world')
    const value = await db.get('hello')
    assert.strictEqual(value, 'world')
  })

  it('put/get [feature]', async function () {
    const db = createdb()
    await db.put(feature.id, feature)
    const value = await db.get(feature.id)
    assert.deepStrictEqual(value, feature)
  })

  it('put/del [other]', async function () {
    const db = createdb()

    await db.put('hello', 'world')
    await db.del('hello')

    try {
      await db.get('hello')
    } catch (expected) {
      assert(expected.type === 'NotFoundError')
    }

    try {
      await db.del('hello')
    } catch (expected) {
      assert(expected.type === 'NotFoundError')
    }
  })

  it('put/del [feature]', async function () {
    const db = createdb()

    await db.put(feature.id, feature)
    await db.del(feature.id)

    try {
      await db.get(feature.id)
    } catch (expected) {
      assert(expected.type === 'NotFoundError')
    }

    try {
      await db.del(feature.id)
    } catch (expected) {
      assert(expected.type === 'NotFoundError')
    }
  })

  it('batch [other]', async function () {
    const db = createdb()

    await db.batch([{ type: 'put', key: 'hello', value: 'world' }])
    const value = await db.get('hello')
    assert.strictEqual(value, 'world')
    await db.batch([{ type: 'del', key: 'hello' }])

    try {
      await db.get('hello')
    } catch (expected) {
      assert(expected.type === 'NotFoundError')
    }
  })

  it('batch [feature]', async function () {
    const db = createdb()

    await db.batch([{ type: 'put', key: feature.id, value: feature }])
    const value = await db.get(feature.id)
    assert.deepStrictEqual(value, feature)
    await db.batch([{ type: 'del', key: feature.id }])

    try {
      await db.get(feature.id)
    } catch (expected) {
      assert(expected.type === 'NotFoundError')
    }
  })

  it('batch [geometry]', async function () {
    // Special handling for geometry: keys.
    // Update only geometry without touching properties.

    const db = createdb()

    const key = `geometry:${feature.id.split(':')[1]}`
    const geometry = { type: 'Point', coordinates: [1700000, 5900000] }
    const expected = { ...feature, geometry }

    await db.batch([{ type: 'put', key: feature.id, value: feature }])
    await db.batch([{ type: 'put', key, value: geometry }])
    const actual = await db.get(feature.id)
    assert.deepStrictEqual(actual, expected)
  })

  const list = (db, options) => new Promise((resolve, reject) => {
    const acc = []
    db.createReadStream(options)
      .on('data', data => acc.push(data))
      .on('err', reject)
      .on('close', () => resolve(acc))
  })

  describe('createReadStream [other]', function () {
    const expected = [
      { key: 'a', value: 1 },
      { key: 'b', value: 2 },
      { key: 'c', value: 3 }
    ]

    it('{ keys: true, value: true }', async function () {
      const db = createdb()
      await db.batch(expected.map(({ key, value }) => ({ type: 'put', key, value })))
      const actual = await list(db, {})
      assert.deepStrictEqual(actual, expected)
    })

    it('{ keys: false, value: true }', async function () {
      const db = createdb()
      await db.batch(expected.map(({ key, value }) => ({ type: 'put', key, value })))
      const actual = await list(db, { keys: false })
      assert.deepStrictEqual(actual, expected.map(R.prop('value')))
    })

    it('{ keys: true, value: false }', async function () {
      const db = createdb()
      await db.batch(expected.map(({ key, value }) => ({ type: 'put', key, value })))
      const actual = await list(db, { values: false })
      assert.deepStrictEqual(actual, expected.map(R.prop('key')))
    })
  })

  describe('createReadStream [feature]', function () {
    const expected = [
      { key: feature.id, value: feature }
    ]

    it('{ keys: true, value: true }', async function () {
      const db = createdb()
      await db.batch(expected.map(({ key, value }) => ({ type: 'put', key, value })))
      const actual = await list(db, {})
      assert.deepStrictEqual(actual, expected)
    })

    it('{ keys: false, value: true }', async function () {
      const db = createdb()
      await db.batch(expected.map(({ key, value }) => ({ type: 'put', key, value })))
      const actual = await list(db, { keys: false })
      assert.deepStrictEqual(actual, expected.map(R.prop('value')))
    })

    it('{ keys: true, value: false }', async function () {
      const db = createdb()
      await db.batch(expected.map(({ key, value }) => ({ type: 'put', key, value })))
      const actual = await list(db, { values: false })
      assert.deepStrictEqual(actual, expected.map(R.prop('key')))
    })
  })

  describe('createReadStream [mixed]', function () {
    const expected = [
      { key: 'a', value: 1 },
      { key: 'b', value: 2 },
      { key: 'c', value: 3 },
      { key: feature.id, value: feature },
      { key: 'x', value: 9 },
      { key: 'y', value: 8 },
      { key: 'z', value: 7 }
    ]

    it('{ keys: true, value: true }', async function () {
      const db = createdb()
      await db.batch(expected.map(({ key, value }) => ({ type: 'put', key, value })))
      const actual = await list(db, {})
      assert.deepStrictEqual(actual, expected)
    })

    it('{ keys: false, value: true }', async function () {
      const db = createdb()
      await db.batch(expected.map(({ key, value }) => ({ type: 'put', key, value })))
      const actual = await list(db, { keys: false })
      assert.deepStrictEqual(actual, expected.map(R.prop('value')))
    })

    it('{ keys: true, value: false }', async function () {
      const db = createdb()
      await db.batch(expected.map(({ key, value }) => ({ type: 'put', key, value })))
      const actual = await list(db, { values: false })
      assert.deepStrictEqual(actual, expected.map(R.prop('key')))
    })
  })
})
