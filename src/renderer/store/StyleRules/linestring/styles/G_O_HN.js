import * as R from 'ramda'

export default ({ TS, geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const fractions = [[0.18, -0.2], [0, 0], [1, 0], [0.82, 0.2]]
  const xs = TS.projectCoordinates(length, angle, coords[0])(fractions)
  const path = TS.lineString(R.props([0, 1, 2, 3], xs))
  return [{ id: 'style:2525c/default-stroke', geometry: path }]
}
