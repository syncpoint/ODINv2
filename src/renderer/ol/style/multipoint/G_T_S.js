import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { DEG2RAD, PI_OVER_2, PI } from '../../../../shared/Math'

// TASKS / SECURE
styles['MultiPoint:G*T*S-----'] = ({ geometry }) => {
  const delta = 330 * DEG2RAD
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const quads = 64
  const arc = TS.arc(coords[0], radius, angle, delta, quads)
  const xs = TS.projectCoordinates(radius, angle - delta + PI_OVER_2, R.last(arc))([
    [0.2, -0.2], [0, 0], [0.2, 0.2]
  ])

  const anchor = TS.point(arc[Math.floor(arc.length / 2)])
  const rotate = TS.rotation(segment) - PI / 12
  const path = TS.union([TS.lineString(arc), TS.lineString(xs)])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: anchor,
      'text-field': '"S"',
      'text-rotate': rotate,
      'text-padding': 5
    }
  ]
}
