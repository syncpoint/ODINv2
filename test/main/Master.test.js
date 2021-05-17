import assert from 'assert'
import levelup from 'levelup'
import memdown from 'memdown'
import encode from 'encoding-down'
import { readJSON } from '../../src/main/legacy/io'
import Master from '../../src/main/Master'

describe('Master', async function () {

  it('transferSources', async function () {
    const expected = await readJSON('./test/data/sources.json')
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const master = new Master(db)
    await master.transferSources(expected)
    const actual = await master.getSources()
    assert.deepStrictEqual(actual, expected)
  })

  it('transferMetadata', async function () {
    const projects = await readJSON('./test/data/legacy-projects.json')
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const master = new Master(db)
    await master.transferMetadata(projects)
    const actual = await master.getProjects()
    const expected = await readJSON('./test/data/metadata.json')
    assert.deepStrictEqual(actual, expected)
  })

  it('putWindowBounds', async function () {
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

    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    await db.put(key, project)
    const master = new Master(db)

    const bounds = { x: 0, y: 0, width: 640, height: 400 }
    await master.putWindowBounds(key, bounds)
    const actual = await db.get(key)
    const expected = { ...project, bounds }

    assert.deepStrictEqual(actual, expected)
  })
})
