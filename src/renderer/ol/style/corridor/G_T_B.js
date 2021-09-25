import { styles } from '../styles'
import * as TS from '../../ts'

// TASKS / BLOCK
styles['G*T*B-----'] = ({ styles, lineString, width }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const fractions = [[0, 1], [0, -1]]

  const path = TS.collect([
    lineString,
    TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])(fractions))
  ])

  return [
    styles.defaultStroke(path),
    styles.outlinedText(TS.point(segment.midPoint()), { angle, text: 'B' })
  ]
}
