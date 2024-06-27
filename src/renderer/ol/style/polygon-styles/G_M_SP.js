import * as R from 'ramda'

export default ({ TS, PI_OVER_2, resolution, geometry }) => {
  const coordinates = geometry.getCoordinates()
  const lineString = TS.lineString(coordinates)
  const indexedLine = TS.lengthIndexedLine(lineString)
  const endIndex = indexedLine.getEndIndex()
  const delta = resolution * 20
  const segmentPoints = R.aperture(2, R.range(0, 1 + Math.ceil(endIndex / delta)).map(i => i * delta))

  const spikes = TS.collect(segmentPoints.map(([a, b]) => {
    const P1 = indexedLine.extractPoint((a + b) / 2)
    const [A, B] = [indexedLine.extractPoint(a), indexedLine.extractPoint(b)]
    const segment = TS.segment([A, B])
    const angle = segment.angle() - PI_OVER_2
    const P2 = TS.projectCoordinate(P1)([angle, delta * 0.75])
    return TS.lineString([P1, P2])
  }))

  return [
    { id: 'style:2525c/solid-stroke', geometry },
    { id: 'style:2525c/solid-stroke', geometry: spikes }
  ]
}
