import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { DEG2RAD, PI_OVER_2, PI } from '../../../../shared/Math'

// TASKS / ISOLATE
styles['MultiPoint:G*T*E-----'] = ({ geometry }) => {
  const delta = 330 * DEG2RAD
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const quads = 64
  const arcs = [
    TS.arc(coords[0], radius, angle, delta, quads),
    TS.arc(coords[0], 0.8 * radius, angle, delta, quads)
  ]

  const teeth = R.range(1, arcs[0].length)
    .filter(i => i % 5 === 0)
    .map(i => [arcs[0][i - 1], arcs[1][i], arcs[0][i + 1]])
    .map(coords => TS.lineString(coords))

  const project = TS.projectCoordinates(radius, angle - delta + PI_OVER_2, R.last(arcs[0]))
  const arrow = project([[0.1, -0.1], [0, 0], [0.1, 0.1]])
  const path = TS.union([...teeth, TS.lineString(arcs[0]), TS.lineString(arrow)])
  const anchor = TS.point(arcs[0][Math.floor(arcs[0].length / 2)])
  const rotate = TS.rotation(segment) - PI / 12

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: anchor,
      'text-field': '"I"',
      'text-rotate': rotate,
      'text-padding': 5
    }
  ]
}
