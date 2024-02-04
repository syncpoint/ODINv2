import * as R from 'ramda'

export default ({ TS, PI_OVER_2, geometry }) => {
  const [x, y, A, B, C, D] = TS.coordinates(geometry)
  const baseline = TS.lineString([x, y])
  const indexedLine = TS.lengthIndexedLine(baseline)
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

  const targetArea = TS.intersection([
    TS.polygon([y, x, farB, farC, y]),
    ring
  ])


  return [{
    id: 'style:2525c/default-stroke',
    // geometry,
    geometry: TS.collect([
      baseline,
      targetArea,
    ])
  }]


  // // FIXME: experimental construction
  // const coords = TS.coordinates(geometry)
  // const segment = TS.segment(coords)
  // const length = segment.getLength()
  // const baselineLength = length / 6
  // const targetAreaWidth = length / 2

  // const farPoint = TS.projectCoordinates(length * 1.25, segment.angle(), coords[0])([
  //   [1, 0]
  // ])

  // const xy = TS.projectCoordinates(baselineLength / 2, segment.angle() - PI_OVER_2, coords[0])([
  //   [-1, 0], [1, 0]
  // ])

  // const ab = TS.projectCoordinates(targetAreaWidth / 2, segment.angle() - PI_OVER_2, farPoint[0])([
  //   [-1, 0], [1, 0]
  // ])

  // // export const projectCoordinates = (distance, angle, coordinate) => fractions =>
  // // fractions
  // //   .map(cs => cs.map(c => c * distance))
  // //   .map(([a, b]) => [angle - Math.atan2(b, a), Math.hypot(a, b)])
  // //   .map(projectCoordinate(coordinate))

  // const targetArea = TS.intersection([
  //   TS.polygon([xy[0], xy[1], ab[1], ab[0], xy[0]]),
  //   TS.difference([
  //     TS.pointBuffer(TS.startPoint(geometry))(length * 1.25),
  //     TS.pointBuffer(TS.startPoint(geometry))(length * 0.75)
  //   ])
  // ])

  // const union = TS.collect([
  //   geometry,
  //   // TS.polygon([xy[0], xy[1], ab[1], ab[0], xy[0]]),
  //   // TS.difference([
  //   //   TS.pointBuffer(TS.startPoint(geometry))(length * 1.25),
  //   //   TS.pointBuffer(TS.startPoint(geometry))(length * 0.75)
  //   // ]),

  //   TS.lineString(xy),
  //   targetArea
  //   // TS.singleSidedLineBuffer(targetArea)(400)

  //   // TS.lineString(xy),
  //   // TS.lineString([xy[0], ab[0]]),
  //   // TS.lineString([xy[1], ab[1]]),
  //   // TS.pointBuffer(TS.startPoint(geometry))(length * 0.75),
  //   // TS.pointBuffer(TS.startPoint(geometry))(length * 1.25)
  // ])
}
