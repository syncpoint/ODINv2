import * as R from 'ramda'

export default ({ TS, PI_OVER_2, resolution, geometry }) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(geometry)
  const count = Math.floor(line.getEndIndex() / (width * 2))
  const offset = (line.getEndIndex() - 2 * count * width) / 2

  const teeth = R
    .aperture(2, R.range(0, count + 1).map(i => offset + 2 * width * i))
    .map(([a, b]) => [
      line.extractPoint(a),
      line.extractPoint(a + width / 2),
      line.extractPoint(b - width / 2),
      line.extractPoint(b)
    ])
    .map(([a, b, c, d]) => [a, b, c, d, TS.segment([b, c]).angle()])
    .map(([a, b, c, d, angle]) => [
      a, b, c, d,
      TS.projectCoordinate(b)([angle + PI_OVER_2, width]),
      TS.projectCoordinate(c)([angle + PI_OVER_2, width])
    ])
    .map(([a, b, c, d, x, y]) => TS.lineString([a, b, x, y, c, d]))

  const path = TS.collect(teeth)

  return [{ id: 'style:2525c/default-stroke', geometry: path }]
}
