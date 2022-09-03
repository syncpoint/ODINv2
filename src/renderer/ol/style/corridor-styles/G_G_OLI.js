export default ({ TS, geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const segments = TS.segments(lineString)
  const anchor = TS.point(segments[0].pointAlong(0.5))

  const path = TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ])

  return [
    { id: 'style:2525c/solid-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: anchor,
      'text-field': 't',
      'text-anchor': 'center',
      'text-padding': 5,
      'text-rotate': TS.rotation(segments[0])
    }
  ]
}
