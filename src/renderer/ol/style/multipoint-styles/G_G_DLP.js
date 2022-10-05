import { openArrow } from './commons'

export default ({ TS, PI_OVER_2, resolution, geometry }) => {
  const [C, A, B] = TS.coordinates(geometry)
  const segmentA = TS.segment([C, A])
  const segmentB = TS.segment([C, B])
  const angleA = segmentA.angle()
  const angleB = segmentB.angle()
  const lineCA = TS.lineString([C, A])
  const lineCB = TS.lineString([C, B])

  const f = (angleB - angleA) > 0 ? 1 : -1
  const line = TS.lengthIndexedLine(lineCA)
  const endIndex = line.getEndIndex()
  const width = resolution * 2
  const X = TS.projectCoordinate(line.extractPoint(0.2 * endIndex))([angleA + PI_OVER_2 * f, width])
  const Y = TS.projectCoordinate(line.extractPoint(0.8 * endIndex))([angleA + PI_OVER_2 * f, width])
  const bar = TS.lineBuffer(TS.lineString([X, Y]))(width)

  const path = TS.collect([
    lineCA,
    lineCB,
    openArrow(TS, resolution, angleA, A),
    openArrow(TS, resolution, angleB, B)
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    { id: 'style:2525c/solid-fill', geometry: bar }
  ]
}
