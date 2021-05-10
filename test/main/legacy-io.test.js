import assert from 'assert'
import path from 'path'
import * as io from '../../src/main/legacy/io'

describe('legacy-io', function () {

  it('readSources', async function () {
    const location = path.resolve('./test/data/home')
    const actual = await io.readSources(location)
    const expected = await io.readJSON('./test/data/sources.json')
    assert.deepStrictEqual(actual, expected)
  })

  it('readProjects', async function () {
    const location = path.resolve('./test/data/home')
    const actual = await io.readProjects(location)
    const expected = [
      '0a44dfaf-1774-482a-bc47-5efcfb8587e6',
      '1df91f1a-4f6b-4aa0-822e-930c63e0b299'
    ]

    assert.deepStrictEqual(actual, expected)
  })

  it('readLayers', async function () {
    const location = path.resolve('./test/data/home')
    const uuid = '0a44dfaf-1774-482a-bc47-5efcfb8587e6'
    const actual = await io.readLayers(location, uuid)
    const expected = ['Feindlage', 'PdD', 'empty']
    assert.deepStrictEqual(actual, expected)
  })

  it('readLayer', async function () {
    const location = path.resolve('./test/data/home')
    const uuid = '0a44dfaf-1774-482a-bc47-5efcfb8587e6'
    const layer = 'PdD'
    const actual = await io.readLayer(location, uuid, layer)
    const expected = await io.readJSON('./test/data/layer.json')
    assert.deepStrictEqual(actual, expected)
  })

  it('readMetadata', async function () {
    const location = path.resolve('./test/data/home')
    const uuid = '0a44dfaf-1774-482a-bc47-5efcfb8587e6'
    const actual = await io.readMetadata(location, uuid)
    const expected = { name: 'Lage LEIBNITZ', lastAccess: '2021-03-17T12:51:21.685Z' }
    assert.deepStrictEqual(actual, expected)
  })

  it('readPreferences', async function () {
    const location = path.resolve('./test/data/home')
    const uuid = '0a44dfaf-1774-482a-bc47-5efcfb8587e6'
    const actual = await io.readPreferences(location, uuid)
    const expected = await io.readJSON('./test/data/preferences.json')
    assert.deepStrictEqual(actual, expected)
  })
})
