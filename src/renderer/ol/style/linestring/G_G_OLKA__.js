import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'

// DIRECTION OF ATTACK / AVIATION
styles['G*G*OLKA--'] = ({ styles, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0.25, 0], [0.4, 0], [0.25, -0.04], [0.4, 0.04], [0.4, -0.04], [0.25, 0.04],
    [0.95, -0.05], [1, 0], [0.95, 0.05]
  ])

  return [
    styles.defaultStroke(TS.collect([
      TS.lineString([coords[0], xs[0]]),
      TS.lineString([xs[1], coords[1]]),
      TS.polygon(R.props([2, 3, 4, 5, 2], xs)),
      TS.lineString(R.props([6, 7, 8], xs))
    ]))
  ]
}
