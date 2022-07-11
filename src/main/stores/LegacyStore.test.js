import assert from 'assert'
import { resolve } from 'path'
import { readJSON } from '../legacy/io'
import { LegacyStore } from './LegacyStore'
import * as L from '../../shared/level'

const pathname = dir => resolve(__dirname, dir)

describe('LegacyStore', async function () {
  const createdb = () => L.leveldb({ encoding: 'json' })

  it('transferSources', async function () {
    const expected = await readJSON(pathname('./data/sources.json'))
    const db = createdb()
    const legacyStore = new LegacyStore(db)
    await legacyStore.transferSources(expected)
    const actual = await legacyStore.getSources()
    assert.deepStrictEqual(actual, expected)
  })

  it('transferMetadata', async function () {
    const projects = await readJSON(pathname('./data/legacy-projects.json'))
    const db = createdb()
    const legacyStore = new LegacyStore(db)
    await legacyStore.transferMetadata(projects)
    const actual = await L.values(db, 'project:')
    const expected = await readJSON(pathname('./data/metadata.json'))
    assert.deepStrictEqual(actual, expected)
  })
})
