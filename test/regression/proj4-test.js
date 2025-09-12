const assert = require('assert')
const proj4 = require('proj4')
const readFeatures = require('./_readFeatures')
const pointGeometry = require('./_pointGeometry')

const WMERC_TO_WGS84 = proj4('EPSG:3857', 'EPSG:4326').forward.bind(proj4)

describe('proj4', function () {
  it('forward :: EPSG e, Coordinate c => (e, e) -> c -> c', function () {

    const expected = [
      [ 15.635147491463018, 46.737465041670696 ],
      [ 15.62602048035823, 46.73247726221611 ],
      [ 15.77090100325836, 46.72354413526854 ],
      [ 15.644539699258557, 46.74672077618425 ],
      [ 15.771977319172601, 46.73513608634371 ],
      [ 15.68361377150267, 46.708018218250736 ],
      [ 15.666835621643074, 46.75330335486476 ],
      [ 15.662254595704747, 46.73421605610169 ],
      [ 15.7631546470191, 46.70953438832319 ],
      [ 15.590562786361255, 46.779060596642736 ],
      [ 15.739300215394175, 46.757477403080856 ]
    ]

    const actual = readFeatures(pointGeometry)
      .map(({ geometry }) => geometry)
      .map(({ coordinates }) => coordinates)
      .map(WMERC_TO_WGS84)

    assert.deepStrictEqual(actual, expected)
  })

  it('defs :: Projection p => p => Unit', function () {

    // 'MGI / Austria Lambert'
    proj4.defs(
      'EPSG:31287',
      '+proj=lcc +lat_1=49 +lat_2=46 +lat_0=47.5 +lon_0=13.33333333333333 +x_0=400000 +y_0=400000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs'
    )

    const expected = [
      [ 9.534557799322943, 46.335600095692584 ], // bounds: north/west
      [ 13.350000058856773, 47.70999997589944 ], // center
      [ 17.366108347173395, 49.01346757657649 ] // bounds: south/east
    ]

    const input = [
      [107724.11, 277804.37],
      [401306.83, 423398.18],
      [694938.75, 575953.62]
    ]

    const forward = proj4('EPSG:31287', 'EPSG:4326').forward.bind(proj4)
    const actual = input.map(forward)
    assert.deepStrictEqual(actual, expected)
  })
})
