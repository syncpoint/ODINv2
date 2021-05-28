import assert from 'assert'
import levelup from 'levelup'
import memdown from 'memdown'
import encode from 'encoding-down'
import { readJSON } from '../../../src/main/legacy/io'
import LegacyStore from '../../../src/main/stores/LegacyStore'

describe('LegacyStore', async function () {

  it('transferSources', async function () {
    const expected = await readJSON('./test/data/sources.json')
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new LegacyStore(db)
    await store.transferSources(expected)
    const actual = await store.getSources()
    assert.deepStrictEqual(actual, expected)
  })

  it('transferMetadata', async function () {
    const projects = await readJSON('./test/data/legacy-projects.json')
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new LegacyStore(db)
    await store.transferMetadata(projects)
    const actual = await store.store.list('project:')
    const expected = await readJSON('./test/data/metadata.json')
    assert.deepStrictEqual(actual, expected)
  })
})
