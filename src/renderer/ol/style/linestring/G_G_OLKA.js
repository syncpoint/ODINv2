import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// DIRECTION OF ATTACK / AVIATION
styles['LineString:G*G*OLKA--'] = ({ styles, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = R.last(TS.segments(lineString))
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[coords.length - 2])([
    [0.25, 0], [0.4, 0], [0.25, -0.04], [0.4, 0.04], [0.4, -0.04], [0.25, 0.04],
    [0.95, -0.05], [1, 0], [0.95, 0.05]
  ])

  if (coords.length > 2) {
    return styles.defaultStroke(TS.collect([
      TS.lineString(R.dropLast(1, coords)),
      TS.lineString([coords[coords.length - 2], xs[0]]),
      TS.lineString([xs[1], coords[coords.length - 1]]),
      TS.polygon(R.props([2, 3, 4, 5, 2], xs)),
      TS.lineString(R.props([6, 7, 8], xs))
    ]))
  } else {
    return styles.defaultStroke(TS.collect([
      TS.lineString([coords[coords.length - 2], xs[0]]),
      TS.lineString([xs[1], coords[coords.length - 1]]),
      TS.polygon(R.props([2, 3, 4, 5, 2], xs)),
      TS.lineString(R.props([6, 7, 8], xs))
    ]))

  }
}
