import { styles } from '../styles'
import * as TS from '../../ts'

const fanLike = label => ({ resolution, geometry }) => {
  const [C, A, B] = TS.coordinates(geometry)
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

  const path = TS.lineString([A, A2, A1, C, B1, B2, B])

  const text = segment => ({
    id: 'style:default-text',
    geometry: TS.point(segment.pointAlong(0.3)),
    'text-field': label,
    'text-rotate': TS.rotation(segment),
    'text-padding': 5
  })

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    { id: 'style:2525c/default-stroke', geometry: TS.collect(arrows.map(coords => TS.lineString(coords))) },
    ...(label ? [TS.segment([C, A1]), TS.segment([C, B1])].map(text) : [])
  ]
}

styles['MultiPoint:G*T*US----'] = fanLike('"S"') // TASKS / SCREEN
styles['MultiPoint:G*T*UG----'] = fanLike('"G"') // TASKS / GUARD
styles['MultiPoint:G*T*UC----'] = fanLike('"C"') // TASKS / COVER
styles['MultiPoint:G*G*GAS---'] = fanLike(null) // SEARCH/RECONNAISSANCE AREA
