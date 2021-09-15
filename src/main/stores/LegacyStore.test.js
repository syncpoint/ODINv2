import assert from 'assert'
import levelup from 'levelup'
import memdown from 'memdown'
import encode from 'encoding-down'
import { readJSON } from '../legacy/io'
import { LegacyStore } from './LegacyStore'
import { values } from '../../shared/level/HighLevel'

const pathname = dir => new URL(dir, import.meta.url).pathname

describe('LegacyStore', async function () {

  it('transferSources', async function () {
    const expected = await readJSON(pathname('./data/sources.json'))
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new LegacyStore(db)
    await store.transferSources(expected)
    const actual = await store.getSources()
    assert.deepStrictEqual(actual, expected)
  })

  it('transferMetadata', async function () {
    const projects = await readJSON(pathname('./data/legacy-projects.json'))
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const store = new LegacyStore(db)
    await store.transferMetadata(projects)
    const actual = await values(db, 'project:')
    const expected = await readJSON(pathname('./data/metadata.json'))
    assert.deepStrictEqual(actual, expected)
  })
})
