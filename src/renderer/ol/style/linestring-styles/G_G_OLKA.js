import * as R from 'ramda'

export default ({ TS, geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = R.last(TS.segments(geometry))
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[coords.length - 2])([
    [0.25, 0], [0.4, 0], [0.25, -0.04], [0.4, 0.04], [0.4, -0.04], [0.25, 0.04],
    [0.95, -0.05], [1, 0], [0.95, 0.05]
  ])

  const collection = coords.length > 2
    ? TS.collect([
      TS.lineString(R.dropLast(1, coords)),
      TS.lineString([coords[coords.length - 2], xs[0]]),
      TS.lineString([xs[1], coords[coords.length - 1]]),
      TS.polygon(R.props([2, 3, 4, 5, 2], xs)),
      TS.lineString(R.props([6, 7, 8], xs))
    ])
    : TS.collect([
      TS.lineString([coords[coords.length - 2], xs[0]]),
      TS.lineString([xs[1], coords[coords.length - 1]]),
      TS.polygon(R.props([2, 3, 4, 5, 2], xs)),
      TS.lineString(R.props([6, 7, 8], xs))
    ])

  return [
    { id: 'style:2525c/default-stroke', geometry: collection }
  ]
}
