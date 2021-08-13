import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// FOLLOW AND ASSUME
styles['LineString:G*T*A-----'] = ({ styles, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  // TODO: pequeño gordito tiene que peder peso rápidamente
  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [0, 0.08], [0, -0.08], [0.32, -0.08], [0.4, 0], [0.32, 0.08],
    [0.8, 0.2], [1, 0], [0.8, -0.2], [0.8, -0.16], [0.96, 0], [0.8, 0.16],
    [0, 0.2],
    [0.16, 0]
  ])

  return styles.defaultStroke(TS.collect([
    TS.lineString(R.props([3, 9], xs)),
    TS.polygon(R.props([0, 1, 2, 3, 4, 0], xs)),
    TS.polygon(R.props([5, 6, 7, 8, 9, 10, 5], xs))
  ]))
}
