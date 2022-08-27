import * as R from 'ramda'


export default ({ TS, PI, PI_OVER_2, geometry, resolution }) => {
  const line = TS.lengthIndexedLine(geometry)
  const length = line.getEndIndex()
  const width = resolution * 15
  const n = Math.floor(length / width)
  const offset = (length - n * width) / 2
  const point = index => line.extractPoint(index)

  const segments = R.range(0, n)
    .map(i => [point(offset + i * width), point(offset + (i + 1) * width)])
    .map(TS.segment)
    .map(s => [s.pointAlong(0.5), s.angle()])
    .map(([C, α]) => [TS.projectCoordinate(C)([α - PI_OVER_2, width / 2]), α])
    .map(([C, α]) => TS.arc(C, width / 2, α + PI, PI, 16))
    .map(coords => TS.lineString(coords))

  const path = TS.collect(segments)
  return [
    { id: 'style:2525c/default-stroke', geometry: path }
  ]
}
