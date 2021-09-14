import assert from 'assert'
import levelup from 'levelup'
import memdown from 'memdown'
import encode from 'encoding-down'
import { readJSON } from './io'
import { transferProject } from '.'
import Store from '../../shared/level/Store'
import { propertiesPartition, geometryPartition } from '../../shared/stores'

const pathname = dir => new URL(dir, import.meta.url).pathname

describe('legacy', async function () {

  it('transferProject', async function () {
    const projects = await readJSON(pathname('./data/legacy-projects.json'))
    const entries = Object.entries(projects)
    const databases = await entries.reduce(async (acc, [key, value]) => {
      const databases = await acc
      databases[key] = levelup(encode(memdown(), { valueEncoding: 'json' }))
      await transferProject(databases[key], value)
      return acc
    }, {})

    // Read back data and compare.
    const acc = { layers: [], features: [], geometries: [], links: [] }
    const actual = await Object.values(databases).reduce(async (acc, db) => {
      const tupleStore = new Store(propertiesPartition(db))
      const geometryStore = new Store(geometryPartition(db))
      const entries = await acc

      entries.layers.push(...await tupleStore.values('layer:'))
      entries.features.push(...await tupleStore.values('feature:'))
      entries.links.push(...await tupleStore.values('link+'))
      entries.geometries.push(...await geometryStore.values('feature:'))

      return entries
    }, acc)

    const expected = await readJSON(pathname('./data/projects.json'))
    assert.deepStrictEqual(actual, expected)
  })
})
