import assert from 'assert'
import { convert } from 'geo-coordinates-parser'

describe('geo-coordinates-parser (regression)', function () {
  it('convert :: Coordinates c => String -> c', function () {
    const input = [
      '-23.3245° S / 28.2344° E',
      '27deg 15min 45.2sec S 18deg 32min 53.7sec E',
      '40° 26.7717 -79° 56.93172',
      '18.24S 22.45E',
      '27.15.45S 18.32.53E'
    ]

    const expected = [
      [ 'DD', 28.2344, -23.3245 ],
      [ 'DMS', 18.5, -27.3 ],
      [ 'DM', -79.95, 40.45 ],
      [ 'DM', 22.75, -18.4 ],
      [ 'DMS', 18.5481, -27.2625 ]
    ]

    const actual = input
      .map(convert)
      .map(({ originalFormat, decimalLongitude, decimalLatitude }) => [originalFormat, decimalLongitude, decimalLatitude])

    assert.deepStrictEqual(actual, expected)
  })
})
