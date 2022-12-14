import * as R from 'ramda'

export default ({ TS, PI_OVER_2, PI_OVER_3, resolution, geometry }) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(geometry)
  const count = Math.floor(line.getEndIndex() / (width * 2))
  const offset = (line.getEndIndex() - 2 * count * width) / 2

  const segmentPoints = R
    .aperture(2, R.range(0, count + 1).map(i => offset + 2 * width * i))
    .map(([a, b]) => [a, a + width / 2, b - width / 2, b])

  const collection = TS.collect(segmentPoints
    .map(([a, b, c, d]) => [
      line.extractPoint(a),
      TS.coordinates(line.extractLine(b, c)),
      line.extractPoint(d)
    ])
    .map(([a, coords, d]) => [a, coords, d, TS.segment([a, d]).angle()])
    .map(([a, coords, d, angle]) => [
      a,
      coords,
      d,
      TS.projectCoordinate(R.head(coords))([angle - PI_OVER_3, width]),
      TS.projectCoordinate(d)([angle - PI_OVER_2, width / 2])
    ])
    .flatMap(([a, coords, d, x, c]) => [
      TS.polygon([x, R.head(coords), R.last(coords), x]),
      TS.lineString([a, R.head(coords)]),
      TS.lineString([R.last(coords), d]),
      TS.pointBuffer(TS.point(c))(width / 3.5)
    ])
  )

  return [{ id: 'style:2525c/solid-fill', geometry: collection }]
}
