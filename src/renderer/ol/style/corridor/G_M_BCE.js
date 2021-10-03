import { styles } from '../styles'
import * as TS from '../../ts'

// TACGRP.MOBSU.OBSTBP.CSGSTE.FRDESY - FORD EASY
styles['LineString:Point:G*M*BCE---'] = ({ geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const path = TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ])

  return [
    { id: 'style:2525c/dashed-stroke', geometry: path }
  ]
}
