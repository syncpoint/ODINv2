import { styles } from '../styles'
import * as TS from '../../ts'

// TACGRP.MOBSU.OBST.RCBB.PLND - BLOWN BRIDGES / PLANNED
styles['LineString:Point:G*M*ORP---'] = ({ geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()

  // NOTE: Picking 2 out of 3 geometries might not be an exact science:
  const [...geometries] = TS.geometries(TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ]))

  const path = TS.collect([geometries[1], geometries[2]])
  return [
    { id: 'style:2525c/dashed-stroke', geometry: path }
  ]
}
