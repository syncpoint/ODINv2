import assert from 'assert'
import levelup from 'levelup'
import memdown from 'memdown'
import encode from 'encoding-down'
import { HighLevel } from './HighLevel'

describe('HighLevel', function () {

  it('put :: String key, Any value => key -> value -> unit', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)
    await level.put('key', 'value')
    assert.strictEqual(await db.get('key'), 'value')
  })

  it('put :: Object -> unit', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)
    await level.put({ a: 1, b: 2, c: 3 })
    assert.strictEqual(await db.get('a'), 1)
    assert.strictEqual(await db.get('b'), 2)
    assert.strictEqual(await db.get('c'), 3)
  })

  it('put :: String key, Any value => [[key, value]] -> unit', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)
    await level.put([['a', 1], ['b', 2], ['c', 3]])
    assert.strictEqual(await db.get('a'), 1)
    assert.strictEqual(await db.get('b'), 2)
    assert.strictEqual(await db.get('c'), 3)
  })

  it('get :: String key => key -> value', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)
    await db.put('key', 'value')
    assert.strictEqual(await level.get('key'), 'value')

    try {
      await level.get('N/A')
      assert.fail()
    } catch (err) {
      assert.strictEqual(err.message, 'Key not found in database [N/A]')
    }
  })

  it('get :: String key, Any default => key -> value || default', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)
    await db.put('key', 'value')

    assert.strictEqual(await level.get('key', 'xyz'), 'value') // default value ignored
    assert.strictEqual(await level.get('N/A', null), null) // null !== undefined
    assert.strictEqual(await level.get('N/A', false), false) // false !== undefined
    assert.strictEqual(await level.get('N/A', true), true)
    assert.strictEqual(await level.get('N/A', 'value'), 'value')
    assert.strictEqual(await level.get('N/A', 0), 0) // 0 !== undefined
    assert.strictEqual(await level.get('N/A', 4711), 4711)
    assert.deepStrictEqual(await level.get('N/A', { a: 'b' }), { a: 'b' })
  })

  it('entries :: () -> {key -> value}', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)

    await db.put('prefix-a', 0)
    await db.put('prefix-b', 1)
    await db.put('c', 2)

    const expected = { c: 2, 'prefix-a': 0, 'prefix-b': 1 }
    const actual = await level.entries()
    assert.deepStrictEqual(actual, expected)
  })

  it('entries :: String -> {key -> value}', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)

    await db.put('prefix-a', 0)
    await db.put('prefix-b', 1)
    await db.put('c', 2)

    const expected = { 'prefix-a': 0, 'prefix-b': 1 }
    const actual = await level.entries('prefix')
    assert.deepStrictEqual(actual, expected)
  })

  it('values :: () -> [value]', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)

    await db.put('prefix-a', 0)
    await db.put('prefix-b', 1)
    await db.put('c', 2)

    const expected = [2, 0, 1]
    const actual = await level.values()
    assert.deepStrictEqual(actual, expected)
  })

  it('values :: String -> [value]', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)

    await db.put('prefix-a', 0)
    await db.put('prefix-b', 1)
    await db.put('c', 2)

    const expected = [0, 1]
    const actual = await level.values('prefix')
    assert.deepStrictEqual(actual, expected)
  })

  it('list :: () -> [{ key, ...value }]', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)

    await db.put('prefix-a', { n: 0 })
    await db.put('prefix-b', { n: 1 })
    await db.put('c', { n: 2 })

    const expected = [
      ['c', { n: 2 }],
      ['prefix-a', { n: 0 }],
      ['prefix-b', { n: 1 }]
    ]

    const actual = await level.list()
    assert.deepStrictEqual(actual, expected)
  })

  it('list :: String -> [{ key, ...value }]', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)

    await db.put('prefix-a', { n: 0 })
    await db.put('prefix-b', { n: 1 })
    await db.put('c', { n: 2 })

    const expected = [
      ['prefix-a', { n: 0 }],
      ['prefix-b', { n: 1 }]
    ]

    const actual = await level.list('prefix')
    assert.deepStrictEqual(actual, expected)
  })

  it('assign :: (key, value) -> Promise()', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const level = new HighLevel(db)

    await db.put('key', { a: '0' })
    await level.assign('key', { b: 1 })
    const actual = await db.get('key')
    const expected = { a: '0', b: 1 }
    assert.deepStrictEqual(actual, expected)
  })
})
