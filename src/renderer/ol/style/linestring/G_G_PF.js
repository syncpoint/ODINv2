import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// DIRECTION OF ATTACK FOR FEINT
styles['G*G*PF----'] = ({ styles, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = R.last(TS.segments(lineString))
  const angle = segment.angle()
  const length = segment.getLength()
  const xs = TS.projectCoordinates(length, angle, coords[coords.length - 2])([
    [0.8, 0.2], [1, 0], [0.8, -0.2], // dashed
    [0.8, -0.136], [0.94, 0], [0.8, 0.136] // solid
  ])

  const geometry = coords.length > 2
    ? TS.collect([
      TS.lineString(R.dropLast(1, coords)),
      TS.lineString(R.props([3, 4, 5], xs)),
      TS.lineString([coords[coords.length - 2], xs[4]])
    ])
    : TS.collect([
      TS.lineString(R.props([3, 4, 5], xs)),
      TS.lineString([coords[coords.length - 2], xs[4]])
    ])

  return [
    styles.solidStroke(geometry),
    styles.dashedStroke(TS.lineString(R.props([0, 1, 2], xs)))
  ]
}
