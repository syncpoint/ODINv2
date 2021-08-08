import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'

// TASKS / BYPASS
styles['G*T*Y-----'] = ({ styles, lineString, width, resolution }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const [p0, p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])

  const geometry = TS.collect([
    TS.difference([
      TS.boundary(TS.lineBuffer(lineString)(width / 2)),
      TS.pointBuffer(TS.endPoint(lineString))(width / 2)
    ]),
    openArrow(resolution, angle, p0),
    openArrow(resolution, angle, p1)
  ])

  return [
    styles.defaultStroke(geometry),
    styles.text(TS.startPoint(lineString), {
      text: 'B',
      flip: true,
      rotation: Math.PI - angle
    })
  ]
}
