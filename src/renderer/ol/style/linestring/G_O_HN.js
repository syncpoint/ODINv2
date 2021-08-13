import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// HAZARD / NAVIGATIONAL
styles['LineString:G*O*HN----'] = ({ styles, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const fractions = [[0.18, -0.2], [0, 0], [1, 0], [0.82, 0.2]]
  const xs = TS.projectCoordinates(length, angle, coords[0])(fractions)
  return styles.defaultStroke(TS.lineString(R.props([0, 1, 2, 3], xs)))
}
