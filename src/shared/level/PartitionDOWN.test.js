import assert from 'assert'
import * as R from 'ramda'
import { PartitionDOWN } from './PartitionDOWN'
import { leveldb, jsonDB, wkbDB } from '.'

const geometry = {
  geometry: { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] }
}

const properties = {
  type: 'Feature',
  name: 'PzGrenKp Lipsch',
  properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
}

const fixture = [
  [{}, 'empty'],
  [0, 'Number (0)'],
  [1, 'Number (1)'],
  ['', 'String ("")'],
  ['XYZ', 'String ("XYZ")'],
  [{ ...properties }, 'properties only'],
  [{ ...geometry }, 'geometry only'],
  [{ ...properties, ...geometry }, 'properties/geometry']
]

describe('PartitionDOWN', function () {

  const createdb = () => {
    const db = leveldb({})
    const propertiesLevel = jsonDB(db)
    const geometriesLevel = wkbDB(db)
    const down = new PartitionDOWN(propertiesLevel, geometriesLevel)
    return leveldb({ down })
  }

  it('get - key cannot be `null`', async function () {
    try {
      await createdb().get(null)
    } catch (err) {
      const expected = 'key cannot be `null` or `undefined`'
      assert.strictEqual(expected, err.message)
    }
  })

  it('get - key cannot be `undefined`', async function () {
    try {
      await createdb().get(undefined)
    } catch (err) {
      const expected = 'key cannot be `null` or `undefined`'
      assert.strictEqual(expected, err.message)
    }
  })

  it('get - key not found in database', async function () {
    try {
      await createdb().get('key')
    } catch (err) {
      const expected = 'Key not found in database [key]'
      assert.strictEqual(expected, err.message)
    }
  })

  it('put - key cannot be `null`', async function () {
    try {
      await createdb().put(null, 'value')
    } catch (err) {
      const expected = 'key cannot be `null` or `undefined`'
      assert.strictEqual(expected, err.message)
    }
  })

  it('put - key cannot be `undefined`', async function () {
    try {
      await createdb().put(undefined, 'value')
    } catch (err) {
      const expected = 'key cannot be `null` or `undefined`'
      assert.strictEqual(expected, err.message)
    }
  })

  it('put - value cannot be `null`', async function () {
    try {
      await createdb().put('key', null)
    } catch (err) {
      const expected = 'value cannot be `null` or `undefined`'
      assert.strictEqual(expected, err.message)
    }
  })

  it('put - value cannot be `undefined`', async function () {
    try {
      await createdb().put('key', undefined)
    } catch (err) {
      const expected = 'value cannot be `null` or `undefined`'
      assert.strictEqual(expected, err.message)
    }
  })

  it('put/get - value :: string', async function () {
    const db = createdb()
    const expected = 'value'
    await db.put('key', expected)
    const actual = await db.get('key')
    assert.deepStrictEqual(actual, expected)
  })

  it('put/get - geometry', async function () {
    const db = createdb()
    const expected = { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] }
    await db.put('key', expected)
    const actual = await db.get('key')
    assert.deepStrictEqual(actual, expected)
  })

  it('put/get - w/o geometry property', async function () {
    const db = createdb()
    const expected = {
      type: 'Feature',
      name: 'PzGrenKp Lipsch',
      properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
    }

    await db.put('key', expected)
    const actual = await db.get('key')
    assert.deepStrictEqual(actual, expected)
  })

  it('put/get - w/ geometry property', async function () {
    const db = createdb()
    const expected = {
      type: 'Feature',
      name: 'PzGrenKp Lipsch',
      geometry: { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] },
      properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
    }

    await db.put('key', expected)
    const actual = await db.get('key')
    assert.deepStrictEqual(actual, expected)
  })

  it('del - key cannot be `null`', async function () {
    try {
      await createdb().del(null)
    } catch (err) {
      const expected = 'key cannot be `null` or `undefined`'
      assert.strictEqual(expected, err.message)
    }
  })

  it('del - key cannot be `undefined`', async function () {
    try {
      await createdb().del(undefined)
    } catch (err) {
      const expected = 'key cannot be `null` or `undefined`'
      assert.strictEqual(expected, err.message)
    }
  })

  it('put/del - value :: string', async function () {
    const db = createdb()
    const expected = 'value'
    await db.put('key', expected)
    await db.del('key')

    try {
      await db.get('key')
    } catch (err) {
      const expected = 'Key not found in database [key]'
      assert.deepEqual(err.message, expected)
    }
  })

  it('put/del - geometry', async function () {
    const db = createdb()
    const expected = { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] }
    await db.put('key', expected)
    await db.del('key')

    try {
      await db.get('key')
    } catch (err) {
      const expected = 'Key not found in database [key]'
      assert.deepEqual(err.message, expected)
    }
  })

  it('put/del - w/o geometry property', async function () {
    const db = createdb()
    const expected = {
      type: 'Feature',
      name: 'PzGrenKp Lipsch',
      properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
    }

    await db.put('key', expected)
    await db.del('key')

    try {
      await db.get('key')
    } catch (err) {
      const expected = 'Key not found in database [key]'
      assert.deepEqual(err.message, expected)
    }
  })

  it('put/del - w/ geometry property', async function () {
    const db = createdb()
    const expected = {
      type: 'Feature',
      name: 'PzGrenKp Lipsch',
      geometry: { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] },
      properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
    }

    await db.put('key', expected)
    await db.del('key')

    try {
      await db.get('key')
    } catch (err) {
      const expected = 'Key not found in database [key]'
      assert.deepEqual(err.message, expected)
    }
  })

  ;[
    [undefined, 'undefined'],
    ['', 'String'],
    [0, 'Number'],
    [{}, 'Object'],
  ].forEach(([value, type]) => {
    it(`batch - requires an array argument [${type}]`, async function () {
      try {
        const db = createdb()
        await db.batch(value)
      } catch (actual) {
        assert.strictEqual(actual.message, 'batch(array) requires an array argument')
      }
    })
  })

  fixture.forEach(([expected, description]) => {
    it(`batch/put [${description}]`, async function () {
      const db = createdb()
      await db.batch([{ type: 'put', key: 'key', value: expected }])
      const actual = await db.get('key')
      assert.deepStrictEqual(actual, expected)
    })
  })

  fixture.forEach(([expected, description]) => {
    it(`batch/del [${description}]`, async function () {
      const db = createdb()
      await db.batch([{ type: 'put', key: 'key', value: expected }])
      await db.batch([{ type: 'del', key: 'key' }])
      const actual = await db.getMany(['key'])
      assert.deepStrictEqual(actual, [undefined])
    })
  })

  const list = (db, options) => new Promise((resolve, reject) => {
    const acc = []
    db.createReadStream(options)
      .on('data', data => acc.push(data))
      .on('err', reject)
      .on('close', () => resolve(acc))
  })

  describe('createReadStream', function () {
    it('{ keys: true, value: true }', async function () {
      const db = createdb()
      const expected = fixture.map(([value], i) => ({ key: String(100 + i), value }))
      await db.batch(expected.map(kv => ({ type: 'put', ...kv })))
      const actual = await list(db, {})
      assert.deepStrictEqual(actual, expected)
    })

    it('{ keys: false, value: true }', async function () {
      const db = createdb()
      const expected = fixture.map(([value], i) => ({ key: String(100 + i), value }))
      await db.batch(expected.map(kv => ({ type: 'put', ...kv })))
      const actual = await list(db, { keys: false })
      assert.deepStrictEqual(actual, expected.map(R.prop('value')))
    })

    it('{ keys: true, value: false }', async function () {
      const db = createdb()
      const expected = fixture.map(([value], i) => ({ key: String(100 + i), value }))
      await db.batch(expected.map(kv => ({ type: 'put', ...kv })))
      const actual = await list(db, { values: false })
      assert.deepStrictEqual(actual, expected.map(R.prop('key')))
    })
  })
})
