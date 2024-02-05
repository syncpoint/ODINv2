export default ({ TS, PI_OVER_2, geometry }) => {
  const [x, y, A, B, C, D] = TS.coordinates(geometry)
  const baseline = TS.lineString([x, y])
  const indexedLine = TS.lengthIndexedLine(baseline)

  // baselineCenter :: jts.geom.Coordinate
  const baselineCenter = indexedLine.extractPoint(0.5 * indexedLine.getEndIndex())
  const frontRadius = TS.segment(baselineCenter, A).getLength()
  const backRadius = TS.segment(baselineCenter, B).getLength()
  const leftSegment = TS.segment(x, B)
  const rightSegment = TS.segment(y, C)

  // Move B and C some more outward to permit proper intersection with ring.
  const farB = TS.projectCoordinates(leftSegment.getLength() * 1.25, leftSegment.angle(), x)([[1, 0]])[0]
  const farC = TS.projectCoordinates(rightSegment.getLength() * 1.25, rightSegment.angle(), y)([[1, 0]])[0]

  const frontCircle = TS.pointBuffer(TS.point(baselineCenter))(frontRadius)
  const backCircle = TS.pointBuffer(TS.point(baselineCenter))(backRadius)
  const ring = TS.difference([backCircle, frontCircle])
  const section = TS.polygon([y, x, farB, farC, y])
  const targetArea = TS.intersection([section, ring])

  return [{
    id: 'style:2525c/default-stroke',
    geometry: TS.collect([
      baseline,
      targetArea
    ])
  }]
}
