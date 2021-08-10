import { styles } from '../styles'
import * as TS from '../../ts'

// TACGRP.MOBSU.OBSTBP.CSGSTE.FRDESY - FORD EASY
styles['G*M*BCE---'] = ({ styles, lineString, width }) => {
  return styles.dashedStroke(TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ]))
}
