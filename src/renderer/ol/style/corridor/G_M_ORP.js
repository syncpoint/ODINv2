import { styles } from '../styles'
import * as TS from '../../ts'

// TACGRP.MOBSU.OBST.RCBB.PLND - BLOWN BRIDGES / PLANNED
styles['G*M*ORP---'] = ({ styles, lineString, width }) => {
  // NOTE: Picking 2 out of 3 geometries might not be an exact science:
  const [...geometries] = TS.geometries(TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ]))

  return styles.dashedStroke(TS.collect([geometries[1], geometries[2]]))
}
