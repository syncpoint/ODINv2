import assert from 'assert'
import path from 'path'
import level from 'level-mem'
import sublevel from 'subleveldown'
import { transfer } from '../../src/main/legacy'
import * as L from '../../src/shared/level'
import { wkb } from '../../src/shared/encoding'

describe('legacy', function () {

  it('#transfer', async function () {
    const directory = path.resolve('./test/main/home')
    const master = level({ valueEncoding: 'json' })

    const databases = {}
    const projectDatabase = project => {
      databases[project] = level()
      return databases[project]
    }

    const options = { directory, master, projectDatabase }
    await transfer(options)

    const transferred = await master.get('legacy:transferred')
    const projects = Object.keys(databases)
    const db = databases[projects[0]]
    const geometries = sublevel(db, 'geometries', wkb)
    const tuples = sublevel(db, 'tuples', { valueEncoding: 'json' })
    const layers = await L.entries(tuples, 'layer:')
    const layer = layers.find(entry => entry.value.name === 'Feindlage')
    const prefix = `feature:${layer.key.split(':')[1]}`
    const features = await L.entries(tuples, prefix)
    const feature = features.find(feature => feature.value.properties.name === 'PzGrenKp Lipsch')
    const geometry = await geometries.get(feature.key)
    const viewport = await tuples.get('property:viewport')
    const project = await master.get(`project:${projects[0]}`)
    const basemaps = await L.entries(master, 'basemap:')
    const basemap = basemaps.find(basemap => basemap.value.name === 'GRAU')

    const expectedProperties = {
      sidc: 'SHGPUCIZ--*E***',
      name: 'PzGrenKp Lipsch',
      f: '(+)',
      n: 'ENY',
      t: '',
      m: ''
    }

    const expectedGeometry = {
      type: 'Point',
      coordinates: [15.656442464637076, 46.77337309586207]
    }

    const expectedViewport = {
      zoom: 12.43743201077918,
      center: [15.703785944998451, 46.743394609814715]
    }

    const expectedProject = {
      name: 'Lage LEIBNITZ',
      lastAccess: '2021-03-17T12:51:21.685Z'
    }

    const expectedBasemap = {
      key: 'basemap:d5ae7787-2b0e-4d42-8a2a-d43fe440fef9',
      value: {
        type: 'WMTS',
        name: 'GRAU',
        options: {
          url: 'https://www.basemap.at/wmts/1.0.0/WMTSCapabilities.xml',
          layer: 'bmapgelaende',
          wgs84BoundingBox: [8.782379, 46.35877, 17.5, 49.037872],
          projection: null
        }
      }
    }

    // legacy:transferred: 1
    // project: 2
    // basemap: 17
    assert.strictEqual((await L.keys(master)).length, 20)

    // layer: 2
    // feature: 43
    // property:viewport: 1
    assert.strictEqual((await L.keys(tuples)).length, 46)

    // feature: 43
    assert.strictEqual((await L.keys(geometries)).length, 43)

    assert.strictEqual(transferred, true)
    assert.strictEqual(Object.keys(databases).length, 2)
    assert.deepStrictEqual(layers.length, 2)
    assert.strictEqual(Object.keys(features).length, 11)
    assert.deepStrictEqual(feature.value.properties, expectedProperties)
    assert.deepStrictEqual(geometry, expectedGeometry)
    assert.deepStrictEqual(viewport, expectedViewport)
    assert.strictEqual((await L.keys(master, 'project:')).length, 2)
    assert.deepStrictEqual(project, expectedProject)
    assert.strictEqual((await L.keys(master, 'basemap:')).length, 17)
    assert.deepStrictEqual(basemap, expectedBasemap)
  })
})
