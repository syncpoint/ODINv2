import * as R from 'ramda'

export default ({ TS, PI_OVER_2, resolution, geometry }) => {
  const coordinates = geometry.getCoordinates()
  const lineString = TS.lineString(coordinates)
  const delta = resolution * 60

  const points = TS.segments(lineString)
    .map(segment => [segment, segment.getLength(), Math.floor(segment.getLength() / delta)])
    .map(([segment, length, n]) => [segment, length, n, (length - n * delta) / 2])
    .flatMap(([segment, length, n, offset]) => {
      const xs = R.range(0, n)
        .map(i => offset + i * delta)
        .flatMap(start => [start + delta / 4, start + delta / 2, start + delta * 3 / 4])
        .map(offset => offset / length)
        .map(fraction => segment.pointAlong(fraction))

      return [
        segment.getCoordinate(0),
        ...R.splitEvery(3, xs).flatMap(([a, b, c]) => [
          a,
          TS.projectCoordinate(b)([segment.angle() + PI_OVER_2, delta / 3]),
          c
        ]),
        segment.getCoordinate(1)
      ]
    })

  points.push(points[0])
  const path = TS.polygon(points)
  return [{ id: 'style:2525c/hatch-fill', geometry: path }]
}
