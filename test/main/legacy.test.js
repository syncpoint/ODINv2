import assert from 'assert'
import levelmem from 'level-mem'
import { readJSON } from '../../src/main/legacy/io'
import { transferProject } from '../../src/main/legacy'
import Store from '../../src/shared/Store'
import { tuplePartition, geometryPartition } from '../../src/shared/stores'

describe('legacy', async function () {

  it('transferProject', async function () {
    const projects = await readJSON('./test/data/legacy-projects.json')
    const entries = Object.entries(projects)
    const databases = await entries.reduce(async (acc, [key, value]) => {
      const databases = await acc
      databases[key] = levelmem()
      await transferProject(databases[key], value)
      return acc
    }, {})

    // Read back data and compare.
    const acc = { layers: {}, features: {}, geometries: {} }
    const actual = await Object.values(databases).reduce(async (acc, db) => {
      const tupleStore = new Store(tuplePartition(db))
      const geometryStore = new Store(geometryPartition(db))
      const entries = await acc
      return {
        layers: { ...entries.layers, ...await tupleStore.entries('layer:') },
        features: { ...entries.features, ...await tupleStore.entries('feature:') },
        geometries: { ...entries.geometries, ...await geometryStore.entries('feature:') }
      }
    }, acc)

    const expected = await readJSON('./test/data/projects.json')
    assert.deepStrictEqual(actual, expected)
  })
})
