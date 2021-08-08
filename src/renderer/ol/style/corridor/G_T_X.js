import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'

// TASKS / CLEAR
styles['G*T*X-----'] = ({ styles, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const [p00, p01, p10, p11, p20, p21] = [
    ...TS.projectCoordinates(width / 2, angle, coords[0])([[0, 0.75], [0, -0.75]]),
    ...TS.projectCoordinates(width / 2, angle, coords[1])([[0, 0.75], [0, -0.75], [0, 1], [0, -1]])
  ]

  const arrows = [p10, coords[1], p11].map(coord => openArrow(resolution, angle, coord))
  const geometry = TS.collect([
    lineString,
    TS.lineString([p00, p10]),
    TS.lineString([p01, p11]),
    TS.lineString([p20, p21]),
    ...arrows
  ])

  return [
    styles.defaultStroke(geometry),
    styles.text(TS.point(segment.midPoint()), {
      text: 'C',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}
