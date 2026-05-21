import assert from 'assert'
import * as L from '../../../src/shared/level'
import { leveldb, wkbDB } from '../../../src/shared/level'

/**
 * Regression coverage for the WKB value encoding.
 *
 * Captures the behaviour of the current (leveldown/encoding-down) stack so
 * the abstract-level migration can be verified against it. The tests only
 * touch the public surface (`leveldb`, `wkbDB`, `L.*` helpers), which stays
 * stable across the migration.
 */
describe('WKB encoding', function () {
  const geometries = () => wkbDB(leveldb({ encoding: 'json' }))

  // One representative of each geometry type wkx round-trips through WKB.
  const samples = {
    Point: {
      type: 'Point',
      coordinates: [15.561677802092738, 46.82068398056285]
    },
    LineString: {
      type: 'LineString',
      coordinates: [
        [15.561677802092738, 46.82068398056285],
        [15.567283499146976, 46.81122129030928],
        [15.572291255182089, 46.79587284762624]
      ]
    },
    Polygon: {
      type: 'Polygon',
      coordinates: [
        [[15.5, 46.8], [15.6, 46.8], [15.6, 46.9], [15.5, 46.9], [15.5, 46.8]],
        [[15.52, 46.82], [15.55, 46.82], [15.55, 46.85], [15.52, 46.85], [15.52, 46.82]]
      ]
    },
    MultiPoint: {
      type: 'MultiPoint',
      coordinates: [[15.56, 46.82], [15.57, 46.81], [15.58, 46.80]]
    },
    MultiLineString: {
      type: 'MultiLineString',
      coordinates: [
        [[15.56, 46.82], [15.57, 46.81]],
        [[15.58, 46.80], [15.59, 46.79]]
      ]
    },
    MultiPolygon: {
      type: 'MultiPolygon',
      coordinates: [
        [[[15.5, 46.8], [15.6, 46.8], [15.6, 46.9], [15.5, 46.8]]],
        [[[15.7, 46.7], [15.8, 46.7], [15.8, 46.8], [15.7, 46.7]]]
      ]
    },
    GeometryCollection: {
      type: 'GeometryCollection',
      geometries: [
        { type: 'Point', coordinates: [15.56, 46.82] },
        { type: 'LineString', coordinates: [[15.56, 46.82], [15.57, 46.81]] }
      ]
    }
  }

  Object.entries(samples).forEach(([name, geometry]) => {
    it(`round-trips a ${name} through put/get`, async function () {
      const db = geometries()
      await db.put('key', geometry)
      assert.deepStrictEqual(await db.get('key'), geometry)
    })
  })

  it('round-trips multiple geometries through batch and getMany', async function () {
    const db = geometries()
    const entries = Object.entries(samples)
    await db.batch(entries.map(([key, value]) => L.putOp(key, value)))

    const keys = entries.map(([key]) => key)
    const values = await db.getMany(keys)
    assert.deepStrictEqual(values, entries.map(([, value]) => value))
  })

  it('round-trips geometries through an iterator (readTuples)', async function () {
    const db = geometries()
    const entries = Object.entries(samples).sort(([a], [b]) => a < b ? -1 : 1)
    await db.batch(entries.map(([key, value]) => L.putOp(key, value)))

    const tuples = await L.readTuples(db, {})
    assert.deepStrictEqual(tuples, entries)
  })

  it('deletes a geometry', async function () {
    const db = geometries()
    await db.put('key', samples.Point)
    await db.del('key')
    // abstract-level returns undefined for a missing key (no rejection).
    assert.strictEqual(await db.get('key'), undefined)
  })
})
