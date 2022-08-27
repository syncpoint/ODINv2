import * as R from 'ramda'

export default ({ TS, geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const length = segment.getLength()
  const angle = segment.angle()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0], [0.08, -0.06], [0.08, 0], [0.08, 0.06],
    [1, 0], [0.92, -0.06], [0.92, 0], [0.92, 0.06]
  ])

  const path1 = TS.lineString([xs[2], xs[6]])
  const path2 = TS.collect([
    TS.polygon(R.props([0, 1, 2, 3, 0], xs)),
    TS.polygon(R.props([4, 5, 6, 7, 4], xs))
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path1 },
    { id: 'style:2525c/solid-fill', geometry: path2 }
  ]
}
