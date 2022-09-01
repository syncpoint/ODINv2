import * as R from 'ramda'

// LINEAR TARGET
export default ({ geometry, TS }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const fractions = [[0, 0.1], [0, -0.1], [1, 0.1], [1, -0.1]]
  const xs = TS.projectCoordinates(length, angle, coords[0])(fractions)

  const collection = TS.collect([
    geometry,
    TS.lineString(R.props([0, 1], xs)),
    TS.lineString(R.props([2, 3], xs))
  ])

  return [{ id: 'style:2525c/default-stroke', geometry: collection }]
}
