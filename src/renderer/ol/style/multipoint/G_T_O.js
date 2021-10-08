import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { DEG2RAD, PI_OVER_2, PI } from '../../../../shared/Math'

// TASKS / OCCUPY
styles['MultiPoint:G*T*O-----'] = ({ geometry }) => {
  const delta = 330 * DEG2RAD
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const quads = 64
  const arc = TS.arc(coords[0], radius, angle, delta, quads)
  const offset = 0.1
  const project = TS.projectCoordinates(radius, angle - delta + PI_OVER_2, R.last(arc))
  const xs = project([[offset, -offset], [-offset, offset], [offset, offset], [-offset, -offset]])
  const anchor = TS.point(arc[Math.floor(arc.length / 2)])
  const rotate = TS.rotation(segment) - PI / 12
  const path = TS.union([
    TS.lineString(arc),
    TS.lineString([xs[0], xs[1]]),
    TS.lineString([xs[2], xs[3]])
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: anchor,
      'text-field': '"O"',
      'text-rotate': rotate,
      'text-padding': 5
    }
  ]
}
