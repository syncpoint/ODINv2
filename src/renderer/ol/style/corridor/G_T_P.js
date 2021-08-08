import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'

// TASKS / PENETRATE
styles['G*T*P-----'] = ({ styles, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  return [
    styles.defaultStroke(TS.collect([
      lineString,
      openArrow(resolution, angle, coords[1]),
      TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]]))
    ])),
    styles.text(TS.point(segment.midPoint()), {
      text: 'P',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}
