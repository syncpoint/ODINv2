import assert from 'assert'
import { resolve } from 'path'
import * as io from '../../../src/main/legacy/io'

const pathname = dir => resolve(__dirname, dir)

describe('io', function () {

  it('readSources', async function () {
    const actual = await io.readSources(pathname('./data/home'))
    const expected = await io.readJSON(pathname('./data/sources.json'))
    assert.deepStrictEqual(actual, expected)
  })

  it('readProjects', async function () {
    const actual = await io.readProjects(pathname('./data/home'))
    const expected = [
      '0a44dfaf-1774-482a-bc47-5efcfb8587e6',
      '1df91f1a-4f6b-4aa0-822e-930c63e0b299'
    ]

    assert.deepStrictEqual(actual, expected)
  })

  it('readLayers', async function () {
    const uuid = '0a44dfaf-1774-482a-bc47-5efcfb8587e6'
    const actual = await io.readLayers(pathname('./data/home'), uuid)
    const expected = ['Feindlage', 'PdD', 'empty']
    assert.deepStrictEqual(actual, expected)
  })

  it('readLayer', async function () {
    const uuid = '0a44dfaf-1774-482a-bc47-5efcfb8587e6'
    const layer = 'PdD'
    const actual = await io.readLayer(pathname('./data/home'), uuid, layer)
    const expected = await io.readJSON(pathname('./data/layer.json'))
    assert.deepStrictEqual(actual, expected)
  })

  it('readMetadata', async function () {
    const uuid = '0a44dfaf-1774-482a-bc47-5efcfb8587e6'
    const actual = await io.readMetadata(pathname('./data/home'), uuid)
    const expected = { name: 'Lage LEIBNITZ', lastAccess: '2021-03-17T12:51:21.685Z' }
    assert.deepStrictEqual(actual, expected)
  })

  it('readPreferences', async function () {
    const uuid = '0a44dfaf-1774-482a-bc47-5efcfb8587e6'
    const actual = await io.readPreferences(pathname('./data/home'), uuid)
    const expected = await io.readJSON(pathname('./data/preferences.json'))
    assert.deepStrictEqual(actual, expected)
  })
})
