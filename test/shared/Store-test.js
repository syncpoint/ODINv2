import assert from 'assert'
import levelup from 'levelup'
import memdown from 'memdown'
import encode from 'encoding-down'
import Store from '../../src/shared/level/Store'

describe('Store', function () {

  it('close :: () -> Promise', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)
    await store.close()
    assert(db.isClosed())
  })

  it('put :: String key, Any value => key -> value -> Promise', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)
    await store.put('key', 'value')
    assert.strictEqual(await db.get('key'), 'value')
  })

  it('put :: Object -> Promise', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)
    await store.put({ a: 1, b: 2, c: 3 })
    assert.strictEqual(await db.get('a'), 1)
    assert.strictEqual(await db.get('b'), 2)
    assert.strictEqual(await db.get('c'), 3)
  })

  it('put :: String key, Any value => [[key, value]] -> Promise', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)
    await store.put([['a', 1], ['b', 2], ['c', 3]])
    assert.strictEqual(await db.get('a'), 1)
    assert.strictEqual(await db.get('b'), 2)
    assert.strictEqual(await db.get('c'), 3)
  })

  it('get :: String key => key => Promise(value)', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)
    await db.put('key', 'value')
    assert.strictEqual(await store.get('key'), 'value')

    try {
      await store.get('N/A')
      assert.fail()
    } catch (err) {
      assert.strictEqual(err.message, 'Key not found in database [N/A]')
    }
  })

  it('get :: String key, Any default => key => Promise(value || default)', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)
    await db.put('key', 'value')

    assert.strictEqual(await store.get('key', 'xyz'), 'value') // default value ignored
    assert.strictEqual(await store.get('N/A', null), null) // null !== undefined
    assert.strictEqual(await store.get('N/A', false), false) // false !== undefined
    assert.strictEqual(await store.get('N/A', true), true)
    assert.strictEqual(await store.get('N/A', 'value'), 'value')
    assert.strictEqual(await store.get('N/A', 0), 0) // 0 !== undefined
    assert.strictEqual(await store.get('N/A', 4711), 4711)
    assert.deepStrictEqual(await store.get('N/A', { a: 'b' }), { a: 'b' })
  })

  it('entries :: () -> Promise({ key -> value })', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)

    await db.put('prefix-a', 0)
    await db.put('prefix-b', 1)
    await db.put('c', 2)

    const expected = { c: 2, 'prefix-a': 0, 'prefix-b': 1 }
    const actual = await store.entries()
    assert.deepStrictEqual(actual, expected)
  })

  it('entries :: String -> Promise({ key -> value })', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)

    await db.put('prefix-a', 0)
    await db.put('prefix-b', 1)
    await db.put('c', 2)

    const expected = { 'prefix-a': 0, 'prefix-b': 1 }
    const actual = await store.entries('prefix')
    assert.deepStrictEqual(actual, expected)
  })

  it('list :: () -> Promise([{ key, ...value }])', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)

    await db.put('prefix-a', { n: 0 })
    await db.put('prefix-b', { n: 1 })
    await db.put('c', { n: 2 })

    const expected = [
      { key: 'c', n: 2 },
      { key: 'prefix-a', n: 0 },
      { key: 'prefix-b', n: 1 }
    ]

    const actual = await store.list()
    assert.deepStrictEqual(actual, expected)
  })

  it('list :: String -> Promise([{ key, ...value }])', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)

    await db.put('prefix-a', { n: 0 })
    await db.put('prefix-b', { n: 1 })
    await db.put('c', { n: 2 })

    const expected = [
      { key: 'prefix-a', n: 0 },
      { key: 'prefix-b', n: 1 }
    ]

    const actual = await store.list('prefix')
    assert.deepStrictEqual(actual, expected)
  })

  it('key :: (Object -> Boolean) -> Promise(String)', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)

    await db.put('a', 0)
    await db.put('b', 1)
    await db.put('c', 1) // cannot be found

    assert.strictEqual(await store.key(value => value === 1), 'b')
    assert.strictEqual(await store.key(value => value === 2), undefined)
  })

  it('key :: (Object -> Boolean) -> String -> Promise(String)', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)

    await db.put('a', 0)
    await db.put('b', 1)
    await db.put('prefix:a', 0)
    await db.put('prefix:b', 1)

    assert.strictEqual(await store.key(value => value === 1, 'prefix'), 'prefix:b')
    assert.strictEqual(await store.key(value => value === 2, 'prefix'), undefined)
  })

  it('assign :: (key, value) -> Promise()', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new Store(db)

    await db.put('key', { a: '0' })
    await store.assign('key', { b: 1 })
    const actual = await db.get('key')
    const expected = { a: '0', b: 1 }
    assert.deepStrictEqual(actual, expected)
  })
})
