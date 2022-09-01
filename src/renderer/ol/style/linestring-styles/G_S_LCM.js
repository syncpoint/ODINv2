import * as R from 'ramda'

export default ({ TS, geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const fractions = [[0, -0.1], [0.8, -0.1], [0.8, -0.16], [1, 0], [0.8, 0.16], [0.8, 0.1], [0, 0.1]]
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])(fractions)
  const path = TS.lineString(R.props([0, 1, 2, 3, 4, 5, 6, 0], xs))
  return [{ id: 'style:2525c/solid-stroke', geometry: path }]
}
