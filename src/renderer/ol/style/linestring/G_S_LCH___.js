import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'

// HALTED CONVOY
styles['G*S*LCH---'] = ({ feature, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
    [0, -0.1], [1, -0.1], [1, 0.1], [0, 0.1],
    [1, 0], [1.16, -0.15], [1.16, 0.15]
  ])

  return styles.solidStroke({}, TS.collect([
    TS.polygon(R.props([0, 1, 2, 3, 0], xs)),
    TS.polygon(R.props([4, 5, 6, 4], xs))
  ]))(feature)
}
