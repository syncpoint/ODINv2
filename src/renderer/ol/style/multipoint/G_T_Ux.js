import { styles } from '../styles'
import * as TS from '../../ts'

const fanLike = label => options => {
  const { resolution, styles, points } = options
  const [C, A, B] = TS.coordinates(points)
  const segmentA = TS.segment([C, A])
  const segmentB = TS.segment([C, B])
  const angleA = segmentA.angle()
  const angleB = segmentB.angle()

  const distance = resolution * 4
  const [A1, A2, B1, B2] = [
    TS.projectCoordinates(distance, angleA, segmentA.pointAlong(0.55))([[0, -1]]),
    TS.projectCoordinates(distance, angleA, segmentA.pointAlong(0.45))([[0, +1]]),
    TS.projectCoordinates(distance, angleB, segmentB.pointAlong(0.55))([[0, +1]]),
    TS.projectCoordinates(distance, angleB, segmentB.pointAlong(0.45))([[0, -1]])
  ].flat()

  const arrowOffsets = [[-0.08, -0.08], [0, 0], [-0.08, 0.08]]
  const arrows = [
    TS.projectCoordinates(segmentA.getLength(), angleA, A)(arrowOffsets),
    TS.projectCoordinates(segmentB.getLength(), angleB, B)(arrowOffsets)
  ]

  const text = segment => styles.outlinedText(TS.point(segment.pointAlong(0.3)), {
    rotation: Math.PI - segment.angle(),
    text: label,
    flip: true
  })

  return [
    styles.defaultStroke(TS.collect([
      TS.lineString([C, A1, A2, A]),
      TS.lineString([C, B1, B2, B]),
      ...arrows.map(coords => TS.lineString(coords))
    ])),
    ...(label ? [TS.segment([C, A1]), TS.segment([C, B1])].map(text) : [])
  ]
}

styles['G*T*US----'] = fanLike('S') // TASKS / SCREEN
styles['G*T*UG----'] = fanLike('G') // TASKS / GUARD
styles['G*T*UC----'] = fanLike('C') // TASKS / COVER
styles['G*G*GAS---'] = fanLike(null) // SEARCH AREA/RECONNAISSANCE AREA
