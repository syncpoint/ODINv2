import assert from 'assert'
import { resolve } from 'path'
import { readJSON } from '../../../src/main/legacy/io'
import { transferProject } from '../../../src/main/legacy/transfer'
import * as L from '../../../src/shared/level'

const pathname = dir => resolve(__dirname, dir)

describe('legacy', async function () {
  it('transferProject', async function () {
    const projects = await readJSON(pathname('./data/legacy-projects.json'))
    const entries = Object.entries(projects)
    const databases = await entries.reduce(async (acc, [key, value]) => {
      const databases = await acc
      databases[key] = L.leveldb({ encoding: 'json' })
      await transferProject(databases[key], value)
      return acc
    }, {})

    // Read back data and compare.
    const actual = await Object.values(databases).reduce(async (acc, db) => {
      const jsonDB = L.jsonDB(db)
      const wbkDB = L.wkbDB(db)
      const entries = await acc
      entries.push(await L.tuples(jsonDB, 'layer:'))
      entries.push(await L.tuples(jsonDB, 'feature:'))
      entries.push(await L.tuples(jsonDB, 'tags+'))
      entries.push(await L.tuples(jsonDB, 'link+'))
      entries.push(await L.tuples(wbkDB, 'feature:'))
      return entries
    }, [])

    const expected = await readJSON(pathname('./data/projects.json'))
    assert.deepStrictEqual(actual.flat(), expected)
  })
})
