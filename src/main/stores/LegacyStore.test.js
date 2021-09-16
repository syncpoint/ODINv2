import assert from 'assert'
import { readJSON } from '../legacy/io'
import { LegacyStore } from './LegacyStore'
import { values } from '../../shared/level/HighLevel'
import { leveldb } from '../../shared/level'

const pathname = dir => new URL(dir, import.meta.url).pathname

describe('LegacyStore', async function () {
  const createdb = () => leveldb({ encoding: 'json' })

  it('transferSources', async function () {
    const expected = await readJSON(pathname('./data/sources.json'))
    const db = createdb()
    const store = new LegacyStore(db)
    await store.transferSources(expected)
    const actual = await store.getSources()
    assert.deepStrictEqual(actual, expected)
  })

  it('transferMetadata', async function () {
    const projects = await readJSON(pathname('./data/legacy-projects.json'))
    const db = createdb()
    const store = new LegacyStore(db)
    await store.transferMetadata(projects)
    const actual = await values(db, 'project:')
    const expected = await readJSON(pathname('./data/metadata.json'))
    assert.deepStrictEqual(actual, expected)
  })
})