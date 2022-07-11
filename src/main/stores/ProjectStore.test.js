import assert from 'assert'
import { ProjectStore } from './ProjectStore'
import { leveldb } from '../../shared/level'

describe('ProjectStore', async function () {

  it('updateWindowBounds', async function () {
    const key = 'project:0a44dfaf-1774-482a-bc47-5efcfb8587e6'
    const project = {
      name: 'Lage LEIBNITZ',
      lastAccess: '2021-03-17T12:51:21.685Z',
      viewport: {
        zoom: 12.43743201077918,
        center: [
          1748137.454923794,
          5900289.66132636
        ]
      }
    }

    const db = leveldb({ encoding: 'json' })
    await db.put(key, project)
    const projectStore = new ProjectStore(db)

    const bounds = { x: 0, y: 0, width: 640, height: 400 }
    await projectStore.updateWindowBounds(key, bounds)
    const actual = await db.get(key)
    const expected = { ...project, bounds }

    assert.deepStrictEqual(actual, expected)
  })
})
