import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'

// TASKS / PENETRATE
styles['G*T*P-----'] = ({ styles, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const midPoint = TS.point(segment.midPoint())

  const path = TS.collect([
    TS.difference([lineString, TS.pointBuffer(midPoint)(resolution * 7)]),
    openArrow(resolution, angle, coords[1]),
    TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]]))
  ])

  return [
    styles.defaultStroke(path),
    styles.outlinedText(midPoint, {
      rotation: TS.rotation(segment),
      text: 'P'
    })
  ]
}
