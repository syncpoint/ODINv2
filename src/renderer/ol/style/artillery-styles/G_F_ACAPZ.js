import BufferParameters from 'jsts/org/locationtech/jts/operation/buffer/BufferParameters.js'

export default ({ TS, PI_OVER_2, geometry }) => {

  const [baseline, taPoints, dzPoints] = TS.geometries(geometry)

  // const coordinates = TS.coordinates(geometry)
  const [x, y] = TS.coordinates(baseline)

  // target area near left, far left, far right (,near right)
  const [TANL, TAFL, TAFR] = TS.coordinates(taPoints)

  const indexedLine = TS.lengthIndexedLine(baseline)
  // baselineCenter :: jts.geom.Coordinate
  const baselineCenter = indexedLine.extractPoint(0.5 * indexedLine.getEndIndex())

  const targetNearRadius = TS.segment(baselineCenter, TANL).getLength()
  const targetFarRadius = TS.segment(baselineCenter, TAFL).getLength()

  // Move B and C some more outward to permit proper intersection with ring.
  const farB = TS.extendSegment(0, 1, TS.segment(x, TAFL)).p1
  const farC = TS.extendSegment(0, 1, TS.segment(y, TAFR)).p1

  const taRing = TS.difference([
    TS.pointBuffer(TS.point(baselineCenter))(targetFarRadius),
    TS.pointBuffer(TS.point(baselineCenter))(targetNearRadius)
  ])

  const taSection = TS.polygon([y, x, farB, farC, y])
  const targetArea = TS.intersection([taSection, taRing])

  // dangerZone1Near, dangerZone1Far, dangerZone1Width, dangerZone2Width
  const [DZ1N, DZ1F, DZ1W, DZ2W] = TS.coordinates(dzPoints)

  const dz1Near = TS.segment(baselineCenter, DZ1N).getLength()
  const dz1Far = TS.segment(baselineCenter, DZ1F).getLength()
  const dz1Ring = TS.difference([
    TS.pointBuffer(TS.point(baselineCenter))(dz1Far),
    TS.pointBuffer(TS.point(baselineCenter))(dz1Near)
  ])

  // Move target area left/right bounds by DZ1 width.
  const taLB = TS.segment(x, farB)
  const taRB = TS.segment(y, farC)

  const dz1LB = TS.translateX(TS.distance(DZ1W, taLB), taLB.angle() - PI_OVER_2, taLB)
  const dz1RB = TS.translateX(TS.distance(DZ1W, taLB), taRB.angle() + PI_OVER_2, taRB)
  const dz1Section = TS.polygon([dz1RB.p0, dz1LB.p0, dz1LB.p1, dz1RB.p1, dz1RB.p0])
  const dz1 = TS.intersection([dz1Section, dz1Ring])

  const dz2 = TS.buffer({
    joinStyle: BufferParameters.JOIN_ROUND,
    quadrantSegments: 16
  })(dz1)(TS.distance(DZ2W, dz1LB))


  return [
    { id: 'style:2525c/default-stroke', 'line-color': 'black', geometry: TS.collect([baseline, targetArea]) },
    { id: 'style:2525c/default-stroke', 'line-color': 'red', geometry: dz1 },
    { id: 'style:2525c/default-stroke', 'line-color': 'blue', geometry: dz2 }
  ]
}
