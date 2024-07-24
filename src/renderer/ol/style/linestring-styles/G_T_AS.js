import * as R from 'ramda'

export default ({ TS, geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)

  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
    [0, 0], [-0.08, -0.08], [0.32, -0.08], [0.4, 0], [0.32, 0.08], [-0.08, 0.08],
    [0.82, -0.08], [1, 0], [0.82, 0.08], [0.82, 0],
    [0.16, 0]
  ])

  const arrow = TS.polygon(R.props([6, 7, 8, 6], xs))
  const path = TS.collect([
    TS.lineString(R.props([3, 9], xs)),
    TS.polygon(R.props([0, 1, 2, 3, 4, 5, 0], xs))
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    { id: 'style:2525c/solid-fill', geometry: arrow }
  ]
}
