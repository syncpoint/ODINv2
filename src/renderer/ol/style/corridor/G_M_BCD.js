import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// TACGRP.MOBSU.OBSTBP.CSGSTE.FRDDFT - FORD DIFFICULT
styles['G*M*BCD---'] = ({ styles, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const midPoint = segment.midPoint()
  const [p0, p1] = TS.projectCoordinates(width / 1.5, angle, midPoint)([[0, 1], [0, -1]])
  const [p00, p01, p10, p11] = [
    ...TS.projectCoordinates(resolution * 4, angle, p0)([[-1, 0], [1, 0]]),
    ...TS.projectCoordinates(resolution * 4, angle, p1)([[-1, 0], [1, 0]])
  ]

  const n = Math.floor(width / resolution / 5)
  const x = R.flatten(R.zip(
    TS.segmentize(TS.segment(p00, p10), n).filter((_, i) => i % 2 === 0),
    TS.segmentize(TS.segment(p01, p11), n).filter((_, i) => i % 2 !== 0)
  ))

  return [
    styles.dashedStroke(TS.difference([
      TS.boundary(TS.lineBuffer(lineString)(width / 2)),
      TS.pointBuffer(TS.startPoint(lineString))(width / 2),
      TS.pointBuffer(TS.endPoint(lineString))(width / 2)
    ])),
    styles.solidStroke(TS.lineString(x))
  ]
}
