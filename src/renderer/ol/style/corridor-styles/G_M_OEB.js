export default ({ TS, geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const path = TS.collect([
    lineString,
    TS.lineString(TS.projectCoordinates(width / 2, angle, coords[0])([[0, 1], [0, -1]]))
  ])

  return [{ id: 'style:2525c/solid-stroke', geometry: path }]
}
