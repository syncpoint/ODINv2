import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// FOLLOW AND SUPPORT
styles['LineString:G*T*AS----'] = ({ styles, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)

  // TODO: pequeño gordito tiene que peder peso rápidamente
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
    [0, 0], [-0.08, -0.08], [0.32, -0.08], [0.4, 0], [0.32, 0.08], [-0.08, 0.08],
    [0.82, -0.08], [1, 0], [0.82, 0.08], [0.82, 0],
    [0.16, 0]
  ])

  const arrow = TS.polygon(R.props([6, 7, 8, 6], xs))
  const geometry = TS.collect([
    TS.lineString(R.props([3, 9], xs)),
    TS.polygon(R.props([0, 1, 2, 3, 4, 5, 0], xs))
  ])

  return [
    styles.defaultStroke(geometry),
    styles.filledStroke(arrow)
  ]
}
