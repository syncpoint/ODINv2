import * as R from 'ramda'

export default ({ TS, geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0.08], [0, -0.08], [0.32, -0.08], [0.4, 0], [0.32, 0.08],
    [0.8, 0.2], [1, 0], [0.8, -0.2], [0.8, -0.16], [0.96, 0], [0.8, 0.16],
    [0, 0.2],
    [0.16, 0]
  ])

  const collection = TS.collect([
    TS.lineString(R.props([3, 9], xs)),
    TS.polygon(R.props([0, 1, 2, 3, 4, 0], xs)),
    TS.polygon(R.props([5, 6, 7, 8, 9, 10, 5], xs))
  ])

  return [{ id: 'style:2525c/default-stroke', geometry: collection }]
}
