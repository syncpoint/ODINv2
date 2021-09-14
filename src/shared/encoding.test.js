import assert from 'assert'
import levelup from 'levelup'
import memdown from 'memdown'
import encode from 'encoding-down'
import sublevel from 'subleveldown'
import { wkb } from './encoding'

describe('WKB encoding', function () {
  it('encodes/decodes GeoJSON geometry as WKB', async function () {
    const db = levelup(encode(memdown(), { valueEncoding: 'json' }))
    const geometries = sublevel(db, 'geometries', wkb)
    const expected = {
      type: 'LineString',
      coordinates: [
        [15.561677802092738, 46.82068398056285],
        [15.567283499146976, 46.81122129030928],
        [15.572291255182089, 46.79587284762624]
      ]
    }

    await geometries.put('key', expected)
    const actual = await geometries.get('key')
    assert.deepStrictEqual(actual, expected)
  })
})
