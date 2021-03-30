import assert from 'assert'
import path from 'path'
import level from 'level-mem'
import * as L from '../../src/shared/level'
import * as Legacy from '../../src/main/legacy'
import { partitions, transfer } from '../../src/main/master'

describe('master#transfer', function () {

  const directory = path.resolve('./test/main/home')
  const master = level({ valueEncoding: 'json' })
  const projectIds = []

  const databases = {}
  const database = project => {
    databases[project] = level()
    return databases[project]
  }

  before(async function () {
    const { sources, projects } = transfer(master, database)
    const home = Legacy.home(directory)
    projects(await Legacy.projects(home))
    sources(await home.sources())

    Object.keys(databases).forEach(id => projectIds.push(id))
  })

  it('master: expected record count', async function () {
    const actual = await L.keys(master)

    // legacy:transferred: 1, project: 2, basemap: 17
    const expected = 20
    assert.strictEqual(actual.length, expected)
  })

  it('master: transferred', async function () {
    const actual = await master.get('legacy:transferred')
    const expected = true
    assert.strictEqual(actual, expected)
  })

  it('master: expected basemap count', async function () {
    const actual = await L.keys(master, 'basemap:')
    const expected = 17
    assert.strictEqual(actual.length, expected)
  })

  it('master: sample basemap', async function () {
    const actual = await master.get('basemap:d5ae7787-2b0e-4d42-8a2a-d43fe440fef9')
    assert.deepStrictEqual(actual, {
      type: 'WMTS',
      name: 'GRAU',
      options: {
        url: 'https://www.basemap.at/wmts/1.0.0/WMTSCapabilities.xml',
        layer: 'bmapgelaende',
        wgs84BoundingBox: [8.782379, 46.35877, 17.5, 49.037872],
        projection: null
      }
    })
  })

  it('master: expected project count', async function () {
    const actual = await L.keys(master, 'project:')
    const expected = 2
    assert.strictEqual(actual.length, expected)
  })

  const tuples = () => partitions.tuples(databases[projectIds[0]])
  const geometries = () => partitions.geometries(databases[projectIds[0]])

  it('project: expected record count', async function () {
    const db = databases[projectIds[0]]
    const actual = await L.keys(db)

    // features/geometries: 2 x 43, layers: 2, viewport: 1
    const expected = 89
    assert.strictEqual(actual.length, expected)
  })

  it('project: viewport', async function () {
    const actual = await tuples().get('property:viewport')
    assert.deepStrictEqual(actual, {
      zoom: 12.43743201077918,
      center: [15.703785944998451, 46.743394609814715]
    })
  })

  it('project: expected layer sample', async function () {
    const actual = await tuples().get('layer:95edaaad-3ba5-4148-9e15-c658387489f7')
    assert.deepStrictEqual(actual, { name: 'Feindlage' })
  })

  it('layer: expected feature count', async function () {
    const actual = await L.keys(tuples(), 'feature:')
    const expected = 43
    assert.strictEqual(actual.length, expected)
  })

  it('layer: expected feature sample (properties)', async function () {
    const featureId = 'feature:95edaaad-3ba5-4148-9e15-c658387489f7/64d8074b-f6ee-47c1-bc97-c7a9451a56fb'
    const actual = await tuples().get(featureId)
    assert.deepStrictEqual(actual, {
      properties: {
        sidc: 'SHGPUCIZ--*E***',
        name: 'PzGrenKp Lipsch',
        f: '(+)',
        n: 'ENY',
        t: '',
        m: ''
      }
    })
  })

  it('layer: expected feature sample (geometry)', async function () {
    const featureId = 'feature:95edaaad-3ba5-4148-9e15-c658387489f7/64d8074b-f6ee-47c1-bc97-c7a9451a56fb'
    const actual = await geometries().get(featureId)
    assert.deepStrictEqual(actual, {
      type: 'Point',
      coordinates: [15.656442464637076, 46.77337309586207]
    })
  })
})
