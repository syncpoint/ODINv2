import { styles } from '../styles'
import * as TS from '../../ts'
import { closedArrow } from './commons'

// TACGRP.MOBSU.OBSTBP.DFTY.ESY - BYPASS EASY
styles['G*M*BDE---'] = ({ styles, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const arrows = TS
    .projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
    .map(point => closedArrow(resolution, angle, point))

  return [
    styles.filledStroke(TS.union(arrows)),
    styles.solidStroke(TS.difference([
      TS.boundary(TS.lineBuffer(lineString)(width / 2)),
      TS.pointBuffer(TS.endPoint(lineString))(width / 2),
      ...arrows
    ]))
  ]
}
