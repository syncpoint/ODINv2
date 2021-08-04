import { styles } from '../styles'
import * as TS from '../ts'

// TASKS / BLOCK
styles['G*T*B-----'] = ({ styles, lineString, width }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const fractions = [[0, 1], [0, -1]]

  return [
    styles.defaultStroke(TS.collect([
      lineString,
      TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])(fractions))
    ])),
    styles.text(TS.point(segment.midPoint()), {
      text: 'B',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}
