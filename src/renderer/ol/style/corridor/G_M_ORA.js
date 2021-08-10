import { styles } from '../styles'
import * as TS from '../../ts'

// TACGRP.MOBSU.OBST.RCBB.ABP - BLOWN BRIDGES / ARMED-BUT PASSABLE
styles['G*M*ORA---'] = ({ styles, lineString, width }) => {
  return styles.solidStroke(TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ]))
}
