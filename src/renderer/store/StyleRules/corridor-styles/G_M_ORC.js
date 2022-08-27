export default ({ TS, geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const A = TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ])

  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const { x, y } = segment.midPoint()
  const B = TS.reflect(0, y, x, y)(A)

  return [{ id: 'style:2525c/solid-stroke', geometry: TS.collect([A, B]) }]
}
