import assert from 'assert'
import { IPCDownClient, IPCServer, GET, PUT, DEL, ITERATOR } from '../../../src/shared/level/ipc'
import { leveldb } from '../../../src/shared/level'

describe('IPCDownClient', function () {
  it('get', async function () {
    const values = { a: 0 }
    const client = new IPCDownClient({ invoke: async (message, key) => values[key] })
    assert.strictEqual(await client.get('a'), 0)
  })

  it('get rejects when the server rejects', async function () {
    const client = new IPCDownClient({
      invoke: async (message, key) => { throw new Error(`key not found [${key}]`) }
    })
    await assert.rejects(() => client.get('a'))
  })

  it('put', async function () {
    const values = {}
    const client = new IPCDownClient({ invoke: async (message, key, value) => { values[key] = value } })
    await client.put('a', 0)
    assert.strictEqual(values.a, 0)
  })

  it('del', async function () {
    const values = { a: 0 }
    const client = new IPCDownClient({ invoke: async (message, key) => { delete values[key] } })
    await client.del('a')
    assert.deepStrictEqual(values, {})
  })

  it('iterator', async function () {
    const expected = [{ key: 'a', value: 0 }, { key: 'b', value: 1 }]
    const client = new IPCDownClient({ invoke: async () => expected })

    const actual = []
    for await (const [key, value] of client.iterator()) actual.push({ key, value })
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
    const db = leveldb({ encoding: 'json' })
    await db.put('a', 0)
    new IPCServer(db, ipc) // eslint-disable-line no-new
    assert.strictEqual(await ipc.invoke(GET, 'a'), 0)
  })

  it('PUT', async function () {
    const db = leveldb({ encoding: 'json' })
    new IPCServer(db, ipc) // eslint-disable-line no-new
    await ipc.invoke(PUT, 'a', 0)
    assert.strictEqual(await db.get('a'), 0)
  })

  it('DEL', async function () {
    const db = leveldb({ encoding: 'json' })
    await db.put('a', 0)
    new IPCServer(db, ipc) // eslint-disable-line no-new
    await ipc.invoke(DEL, 'a')
    assert.strictEqual(await db.get('a'), undefined)
  })

  it('ITERATOR', async function () {
    const db = leveldb({ encoding: 'json' })
    await db.put('a', 0)
    await db.put('b', 1)
    new IPCServer(db, ipc) // eslint-disable-line no-new
    const actual = await ipc.invoke(ITERATOR, { keys: true, values: true })
    assert.deepStrictEqual(actual, [{ key: 'a', value: 0 }, { key: 'b', value: 1 }])
  })
})
