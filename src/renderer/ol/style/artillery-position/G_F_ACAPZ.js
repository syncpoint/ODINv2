
// TODO: remove when done

export default ({ TS, PI_OVER_2, geometry }) => {

  console.log('[G_F_ACAPZ]', geometry)

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


  return [{ id: 'style:2525c/default-stroke', geometry }]
}
