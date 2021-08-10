import { styles } from '../styles'
import * as TS from '../../ts'

// TACGRP.MOBSU.OBST.OBSEFT.BLK - OBSTACLE EFFECT / BLOCK
styles['G*M*OEB---'] = ({ styles, lineString, width }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  return styles.solidStroke(TS.collect([
    lineString,
    TS.lineString(TS.projectCoordinates(width / 2, angle, coords[0])([[0, 1], [0, -1]]))
  ]))
}
