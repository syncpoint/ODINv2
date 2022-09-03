export default ({ TS, geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()

  // NOTE: Picking 2 out of 3 geometries might not be an exact science:
  const [...geometries] = TS.geometries(TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ]))

  return [
    { id: 'style:2525c/dashed-stroke', geometry: geometries[1] },
    { id: 'style:2525c/solid-stroke', geometry: geometries[2] }
  ]
}
