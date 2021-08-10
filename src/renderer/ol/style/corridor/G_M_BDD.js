import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { closedArrow } from './commons'

// TACGRP.MOBSU.OBSTBP.DFTY.DFT - BYPASS DIFFICULT
styles['G*M*BDD---'] = ({ styles, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const arrows = TS
    .projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
    .map(point => closedArrow(resolution, angle, point))

  const [p0, p1] = TS.projectCoordinates(width / 2, angle, coords[0])([[0, 1], [0, -1]])
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
    styles.filledStroke(TS.union(arrows)),
    styles.solidStroke(TS.collect([
      TS.difference([
        TS.boundary(TS.lineBuffer(lineString)(width / 2)),
        TS.pointBuffer(TS.startPoint(lineString))(width / 2),
        TS.pointBuffer(TS.endPoint(lineString))(width / 2),
        ...arrows
      ]),
      TS.lineString([p0, ...x, p1])
    ]))
  ]
}
