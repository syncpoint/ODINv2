import assert from 'assert'
import levelup from 'levelup'
import memdown from 'memdown'
import encode from 'encoding-down'
import { IPCDownClient, IPCServer, GET, PUT, DEL, ITERATOR } from '../../src/shared/level/ipc'

describe('IPCDownClient', function () {
  it('GET', async function () {
    const values = { a: 0 }
    const client = new IPCDownClient({
      invoke: async function (message, key, options) {
        return values[key]
      }
    })

    const db = levelup(client)
    const actual = await db.get('a')
    assert.strictEqual(actual, 0)
  })

  it('GET (key not found)', async function () {
    const client = new IPCDownClient({
      invoke: async function (message, key, options) {
        throw new Error(`Key not found in database [${key}]`)
      }
    })

    const db = levelup(client)
    try {
      await db.get('a')
      assert.fail()
    } catch (err) {
      // all good.
    }
  })

  it('PUT', async function () {
    const values = {}
    const client = new IPCDownClient({
      invoke: async function (message, key, value, options) {
        values[key] = value
      }
    })

    const db = levelup(client)
    await db.put('a', 0)
    assert.strictEqual(values.a, 0)
  })

  it('DEL', async function () {
    const values = { a: 0 }
    const client = new IPCDownClient({
      invoke: async function (message, key, options) {
        delete values[key]
      }
    })

    const db = levelup(client)
    await db.del('a')
    assert.deepStrictEqual(values, {})
  })

  it('ITERATOR', async function () {
    const expected = [{ key: 'a', value: 0 }, { key: 'b', value: 1 }]
    const client = new IPCDownClient({
      invoke: async function (message, options) {
        return expected
      }
    })

    const db = levelup(client)
    const actual = await new Promise(resolve => {
      const acc = []
      db.createReadStream()
        .on('data', data => acc.push(data))
        .on('end', () => resolve(acc))
    })

    assert.deepStrictEqual(actual, expected)
  })
})

describe('IPCServer', function () {
  const event = {} // ignored
  const handlers = {}
  const ipc = {
    handle: (key, handler) => (handlers[key] = handler),
    invoke: (key, ...args) => handlers[key](event, ...args)
  }

  it('GET', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    await db.put('a', 0)
    /* eslint-disable no-new */
    new IPCServer(db, ipc)
    /* eslint-enable no-new */
    const actual = await ipc.invoke(GET, 'a')
    assert.strictEqual(actual, 0)
  })

  it('PUT', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    /* eslint-disable no-new */
    new IPCServer(db, ipc)
    /* eslint-enable no-new */
    await ipc.invoke(PUT, 'a', 0)
    const actual = await db.get('a')
    assert.strictEqual(actual, 0)
  })

  it('DEL', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    await db.put('a', 0)
    /* eslint-disable no-new */
    new IPCServer(db, ipc)
    /* eslint-enable no-new */
    await ipc.invoke(DEL, 'a')

    try {
      await db.get('a')
      assert.fail()
    } catch (err) {
      // all good
    }
  })

  it('ITERATOR', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    await db.put('a', 0)
    await db.put('b', 1)
    /* eslint-disable no-new */
    new IPCServer(db, ipc)
    /* eslint-enable no-new */
    const actual = await ipc.invoke(ITERATOR, { keys: true, values: true })
    const expected = [{ key: 'a', value: 0 }, { key: 'b', value: 1 }]
    assert.deepStrictEqual(actual, expected)
  })
})
