import { styles } from '../styles'
import * as TS from '../../ts'

// TACGRP.MOBSU.OBST.RCBB.SAFE - BLOWN BRIDGES / SAFE
styles['G*M*ORS---'] = ({ styles, lineString, width }) => {

  // NOTE: Picking 2 out of 3 geometries might not be an exact science:
  const [...geometries] = TS.geometries(TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ]))

  return [
    styles.dashedStroke(geometries[1]),
    styles.solidStroke(geometries[2])
  ]
}
