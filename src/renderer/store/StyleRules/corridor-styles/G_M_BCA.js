export default ({ TS, geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  const as = TS.projectCoordinates(width / 2, angle, coords[0])([[0, -1], [0, 1]])
  const bs = TS.projectCoordinates(width / 2, angle, coords[1])([[0, -1], [0, 1]])
  const distance = length * 0.15
  const xs = [
    ...TS.projectCoordinates(distance, angle, as[0])([[-1, -1]]),
    ...TS.projectCoordinates(distance, angle, as[1])([[-1, 1]]),
    ...TS.projectCoordinates(distance, angle, bs[0])([[1, -1]]),
    ...TS.projectCoordinates(distance, angle, bs[1])([[1, 1]])
  ]

  const path = TS.collect([
    TS.lineString([xs[0], as[0], bs[0], xs[2]]),
    TS.lineString([xs[1], as[1], bs[1], xs[3]])
  ])

  return [
    { id: 'style:2525c/solid-stroke', geometry: path }
  ]
}
