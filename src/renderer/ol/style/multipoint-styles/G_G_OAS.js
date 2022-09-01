import { openArrow } from './commons'

export default ({ TS, PI_OVER_4, geometry, resolution }) => {
  const [A, B, C, D] = TS.coordinates(geometry)
  const segmentAB = TS.segment([A, B])
  const segmentAC = TS.segment([A, C])
  const segmentBD = TS.segment([B, D])
  const angle = segmentAB.angle()
  const length = segmentAB.getLength()

  const E = TS.projectCoordinate(A)([angle + 5 * PI_OVER_4, length / 4])
  const F = TS.projectCoordinate(B)([angle + 7 * PI_OVER_4, length / 4])

  const path = TS.collect([
    TS.lineString([A, B]),
    TS.lineString([A, C]),
    TS.lineString([B, D]),
    TS.lineString([A, E]),
    TS.lineString([B, F]),
    openArrow(TS, resolution, segmentAC.angle(), C),
    openArrow(TS, resolution, segmentBD.angle(), D)
  ])
  return [
    { id: 'style:2525c/default-stroke', geometry: path }
  ]
}
