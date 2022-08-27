import * as R from 'ramda'

export default ({ TS, geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [-0.09, -0.08], [0, 0], [-0.09, 0.08],
    [1.09, -0.08], [1, 0], [1.09, 0.08]
  ])

  const path = TS.collect([
    geometry,
    TS.lineString(R.props([0, 1, 2], xs)),
    TS.lineString(R.props([3, 4, 5], xs))
  ])

  return [{ id: 'style:2525c/default-stroke', geometry: path }]
}
