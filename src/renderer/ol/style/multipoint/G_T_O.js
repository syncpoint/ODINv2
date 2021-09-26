import * as R from 'ramda'
import { styles } from '../styles'
import { quads, arcText } from './commons'
import * as TS from '../../ts'
import { DEG2RAD, PI_OVER_2 } from '../../../../shared/Math'


// TASKS / OCCUPY
styles['MultiPoint:G*T*O-----'] = ({ styles, points, resolution }) => {
  const delta = 330 * DEG2RAD
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arc = TS.arc(coords[0], radius, angle, delta, quads)

  const xs = TS.projectCoordinates(radius, angle - delta + PI_OVER_2, R.last(arc))([
    [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2]
  ])

  const textAnchor = TS.point(arc[Math.floor(arc.length / 2)])
  const geometry = TS.difference([
    TS.lineString(arc),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    arcText(styles)(textAnchor, TS.rotation(segment), 'O'),
    styles.defaultStroke(TS.union([
      geometry,
      TS.lineString([xs[0], xs[1]]),
      TS.lineString([xs[2], xs[3]])
    ]))
  ]
}
