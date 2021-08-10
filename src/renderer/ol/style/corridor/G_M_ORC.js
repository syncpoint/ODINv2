import { styles } from '../styles'
import * as TS from '../../ts'

// TACGRP.MOBSU.OBST.RCBB.EXCD - BLOWN BRIDGES / EXECUTED
styles['G*M*ORC---'] = ({ styles, lineString, width }) => {
  const A = TS.difference([
    TS.boundary(TS.lineBuffer(lineString)(width / 2)),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2),
    TS.pointBuffer(TS.endPoint(lineString))(width / 2)
  ])

  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const { x, y } = segment.midPoint()
  const B = TS.reflect(0, y, x, y)(A)

  return styles.solidStroke(TS.collect([A, B]))
}
