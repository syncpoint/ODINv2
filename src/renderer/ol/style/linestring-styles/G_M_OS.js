import * as R from 'ramda'

export default ({ TS, PI_OVER_3, resolution, geometry }) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(geometry)
  const firstSegment = line.extractLine(0, width)
  const coords = TS.coordinates(firstSegment)
  const angle = TS.segment(TS.coordinates(firstSegment)).angle()
  const lastSegment = line.extractLine(width, line.getEndIndex())
  const a = R.head(coords)
  const b = TS.projectCoordinate(a)([angle + PI_OVER_3, width])
  const c = R.last(coords)
  const path = TS.lineString([a, b, c, ...TS.coordinates(lastSegment)])
  return [{ id: 'style:2525c/default-stroke', geometry: path }]
}
