import assert from 'assert'
import levelup from 'levelup'
import memdown from 'memdown'
import encode from 'encoding-down'
import { readJSON } from './io'
import { transferProject } from '.'
import { values } from '../../shared/level/HighLevel'
import { propertiesPartition, geometryPartition } from '../../shared/level'

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
      const properties = propertiesPartition(db)
      const geometries = geometryPartition(db)
      const entries = await acc

      entries.layers.push(...await values(properties, 'layer:'))
      entries.features.push(...await values(properties, 'feature:'))
      entries.links.push(...await values(properties, 'link+'))
      entries.geometries.push(...await values(geometries, 'feature:'))

      return entries
    }, acc)

    const expected = await readJSON(pathname('./data/projects.json'))
    assert.deepStrictEqual(actual, expected)
  })
})
