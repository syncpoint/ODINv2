import { styles } from '../styles'
import * as TS from '../../ts'

// TASKS / BLOCK
styles['G*T*B-----'] = ({ styles, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const fractions = [[0, 1], [0, -1]]
  const midPoint = TS.point(segment.midPoint())

  const path = TS.collect([
    TS.difference([lineString, TS.pointBuffer(midPoint)(resolution * 7)]),
    TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])(fractions))
  ])

  return [
    styles.defaultStroke(path),
    styles.outlinedText(midPoint, {
      rotation: TS.rotation(segment),
      text: 'B'
    })
  ]
}
