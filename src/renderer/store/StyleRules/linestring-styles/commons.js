/* eslint-disable camelcase */
import * as R from 'ramda'

export const teeth_1 = ({ TS, PI_OVER_3, geometry, resolution }) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(geometry)
  const count = Math.floor(line.getEndIndex() / width)
  const offset = (line.getEndIndex() - count * width) / 2

  return R
    .aperture(2, R.range(0, count + 1).map(i => offset + width * i))
    .map(([a, b]) => [line.extractPoint(a), line.extractPoint(b), line.extractLine(a, b)])
    .map(([a, b, line]) => [a, TS.segment([a, b]).angle(), TS.coordinates(line)])
    .map(([a, angle, coords]) => [TS.projectCoordinate(a)([angle + PI_OVER_3, width]), coords])
    .map(([c, coords]) => TS.polygon([c, ...coords, c]))
}

export const teeth_2 = direction => ({ TS, PI_OVER_3, geometry, resolution }) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(geometry)
  const count = Math.floor(line.getEndIndex() / (width * 2))
  const offset = (line.getEndIndex() - 2 * count * width) / 2

  return R
    .aperture(2, R.range(0, count + 1).map(i => offset + 2 * width * i))
    .map(([a, b]) => [
      line.extractPoint(a),
      line.extractPoint(a + width / 2),
      line.extractPoint(b - width / 2),
      line.extractPoint(b)
    ])
    .map(([a, b, c, d]) => [a, b, c, d, TS.segment([b, c]).angle()])
    .map(([a, b, c, d, angle]) => [a, b, c, d, TS.projectCoordinate(b)([angle + direction * PI_OVER_3, width])])
    .map(([a, b, c, d, x]) => TS.lineString([a, b, x, c, d]))
}

export const fencePoints = (factor, { TS, geometry, resolution }) => {
  const line = TS.lengthIndexedLine(geometry)
  const length = line.getEndIndex()
  const width = resolution * factor
  const n = Math.floor(length / width)
  const offset = (length - n * width) / 2

  return R.range(0, n).map(i => {
    const A = line.extractPoint(offset + i * width)
    const B = line.extractPoint(offset + (i + 1) * width)
    const segment = TS.segment([A, B])
    return [line.extractPoint(offset + i * width + width / 2), segment.angle()]
  })
}

export const fenceX = ({ TS, PI }) => ([point, angle, displacement]) => ({
  id: 'style:2525c/fence-x',
  geometry: TS.point(point),
  'shape-rotate': PI - angle,
  'shape-offset': displacement || [0, 0]
})

export const fenceO = ({ TS, PI }) => ([point, angle, displacement]) => ({
  id: 'style:2525c/fence-o',
  geometry: TS.point(point),
  'shape-rotate': PI - angle,
  'shape-offset': displacement || [0, 0]
})

export const fenceXX = ({ TS, PI }) => ([point, angle]) => [
  {
    id: 'style:2525c/fence-x',
    geometry: TS.point(point),
    'shape-rotate': PI - angle,
    'shape-offset': [-8, 0]
  },
  {
    id: 'style:2525c/fence-x',
    geometry: TS.point(point),
    'shape-rotate': PI - angle,
    'shape-offset': [8, 0]
  }
]
