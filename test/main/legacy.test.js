import assert from 'assert'
import levelup from 'levelup'
import memdown from 'memdown'
import encode from 'encoding-down'
import { readJSON } from '../../src/main/legacy/io'
import { transferProject } from '../../src/main/legacy'
import Store from '../../src/shared/level/Store'
import { tuplePartition, geometryPartition } from '../../src/shared/stores'

describe('legacy', async function () {

  it('transferProject', async function () {
    const projects = await readJSON('./test/data/legacy-projects.json')
    const entries = Object.entries(projects)
    const databases = await entries.reduce(async (acc, [key, value]) => {
      const databases = await acc
      databases[key] = levelup(encode(memdown(), { valueEncoding: 'json' }))
      await transferProject(databases[key], value)
      return acc
    }, {})

    // Read back data and compare.
    const acc = { layers: [], features: [], geometries: [] }
    const actual = await Object.values(databases).reduce(async (acc, db) => {
      const tupleStore = new Store(tuplePartition(db))
      const geometryStore = new Store(geometryPartition(db))
      const entries = await acc

      entries.layers.push(...await tupleStore.values('layer:'))
      entries.features.push(...await tupleStore.values('feature:'))
      entries.geometries.push(...await geometryStore.values('feature:'))

      return entries
    }, acc)

    const expected = await readJSON('./test/data/projects.json')
    assert.deepStrictEqual(actual, expected)
  })
})
