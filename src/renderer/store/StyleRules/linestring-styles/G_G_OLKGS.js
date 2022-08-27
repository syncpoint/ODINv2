import * as R from 'ramda'

export default ({ TS, geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = R.last(TS.segments(geometry))
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[coords.length - 2])([
    [0.86, -0.1], [1, 0], [0.86, 0.1]
  ])

  const collection = TS.collect([
    geometry,
    TS.lineString(R.props([0, 1, 2], xs))
  ])

  return [{ id: 'style:2525c/default-stroke', geometry: collection }]
}
