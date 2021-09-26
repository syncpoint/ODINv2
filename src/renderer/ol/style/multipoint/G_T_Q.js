import * as R from 'ramda'
import { styles } from '../styles'
import { quads, arcText } from './commons'
import * as TS from '../../ts'
import { DEG2RAD, PI_OVER_2 } from '../../../../shared/Math'

// TASKS / RETAIN
styles['MultiPoint:G*T*Q-----'] = ({ styles, points, resolution }) => {
  const delta = 330 * DEG2RAD
  const coords = TS.coordinates(points)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const arcs = [
    TS.arc(coords[0], radius, angle, delta, quads),
    TS.arc(coords[0], 0.8 * radius, angle, delta, quads)
  ]

  const spikes = R.range(1, arcs[0].length - 2)
    .filter(i => i % 2 === 0)
    .map(i => [arcs[0][i], arcs[1][i]])
    .map(coords => TS.lineString(coords))

  const xs = TS.projectCoordinates(radius, angle - delta + PI_OVER_2, R.last(arcs[1]))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])

  const textAnchor = TS.point(arcs[1][Math.floor(arcs[0].length / 2)])
  const geometry = TS.difference([
    TS.union([...spikes, TS.lineString(arcs[1])]),
    TS.pointBuffer(textAnchor)(resolution * 10)
  ])

  return [
    arcText(styles)(textAnchor, TS.rotation(segment), 'R'),
    styles.defaultStroke(TS.union([geometry, TS.lineString(xs)]))
  ]
}
