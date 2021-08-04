import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../ts'

// MOVING CONVOY
styles['G*S*LCM---'] = ({ styles, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const fractions = [[0, -0.1], [0.8, -0.1], [0.8, -0.16], [1, 0], [0.8, 0.16], [0.8, 0.1], [0, 0.1]]
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])(fractions)
  const geometry = TS.lineString(R.props([0, 1, 2, 3, 4, 5, 6, 0], xs))
  return styles.solidStroke(geometry)
}
