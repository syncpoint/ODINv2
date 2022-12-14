import assert from 'assert'
import * as R from 'ramda'
import { PartitionDOWN } from './PartitionDOWN'
import { leveldb, jsonDB, wkbDB } from '.'

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


  it('batch - value :: string', async function () {
    const db = createdb()

    const expected = 'value'
    await db.batch([{ type: 'put', key: 'key', value: expected }])
    const actual = await db.get('key')
    assert.strictEqual(actual, expected)

    await db.batch([{ type: 'del', key: 'key' }])

    try {
      await db.get('key')
    } catch (err) {
      const expected = 'Key not found in database [key]'
      assert.deepEqual(err.message, expected)
    }
  })

  it('batch - geometry', async function () {
    const db = createdb()

    const expected = { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] }
    await db.batch([{ type: 'put', key: 'key', value: expected }])
    const actual = await db.get('key')
    assert.deepStrictEqual(actual, expected)

    await db.batch([{ type: 'del', key: 'key' }])

    try {
      await db.get('key')
    } catch (err) {
      const expected = 'Key not found in database [key]'
      assert.deepEqual(err.message, expected)
    }
  })

  it('batch - w/o geometry property', async function () {
    const db = createdb()
    const expected = {
      type: 'Feature',
      name: 'PzGrenKp Lipsch',
      properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
    }

    await db.batch([{ type: 'put', key: 'key', value: expected }])
    const actual = await db.get('key')
    assert.deepStrictEqual(actual, expected)

    await db.batch([{ type: 'del', key: 'key' }])

    try {
      await db.get('key')
    } catch (err) {
      const expected = 'Key not found in database [key]'
      assert.deepEqual(err.message, expected)
    }
  })


  it('batch - w/ geometry property', async function () {
    const db = createdb()
    const expected = {
      type: 'Feature',
      name: 'PzGrenKp Lipsch',
      geometry: { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] },
      properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
    }

    await db.batch([{ type: 'put', key: 'key', value: expected }])
    const actual = await db.get('key')
    assert.deepStrictEqual(actual, expected)

    await db.batch([{ type: 'del', key: 'key' }])

    try {
      await db.get('key')
    } catch (err) {
      const expected = 'Key not found in database [key]'
      assert.deepEqual(err.message, expected)
    }
  })


  const list = (db, options) => new Promise((resolve, reject) => {
    const acc = []
    db.createReadStream(options)
      .on('data', data => acc.push(data))
      .on('err', reject)
      .on('close', () => resolve(acc))
  })

  describe('createReadStream', function () {
    const expected = [
      {
        key: 'a',
        value: 'value'
      },
      {
        key: 'b',
        value: { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] }
      },
      {
        key: 'c',
        value: {
          type: 'Feature',
          name: 'PzGrenKp Lipsch',
          properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
        }
      },
      {
        key: 'd',
        value: {
          type: 'Feature',
          name: 'PzGrenKp Lipsch',
          geometry: { type: 'Point', coordinates: [1742867.2027975845, 5905160.9281057175] },
          properties: { sidc: 'SHGPUCIZ--*E***', f: '(+)', n: 'ENY' }
        }
      }
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
