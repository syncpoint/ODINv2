import { styles } from '../styles'
import * as TS from '../../ts'
import { closedArrow } from './commons'

// TACGRP.MOBSU.OBSTBP.DFTY.IMP - BYPASS IMPOSSIBLE
styles['G*M*BDI---'] = ({ styles, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const arrows = TS
    .projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
    .map(point => closedArrow(resolution, angle, point))

  const distance = resolution * 8
  const d = 1 / Math.sqrt(2)
  const [p00, p01, p10, p11] = TS.projectCoordinates(distance, angle, coords[0])(
    [[-d, d], [d, d], [-d, -d], [d, -d]]
  )

  return [
    styles.filledStroke(TS.union(arrows)),
    styles.solidStroke(TS.collect([
      TS.difference([
        TS.boundary(TS.lineBuffer(lineString)(width / 2)),
        TS.pointBuffer(TS.endPoint(lineString))(width / 2),
        TS.pointBuffer(TS.startPoint(lineString))(distance),
        ...arrows
      ]),
      TS.lineString([p00, p01]),
      TS.lineString([p10, p11])
    ]))
  ]
}
