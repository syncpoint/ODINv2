import { styles } from '../styles'
import * as TS from '../../ts'

// SENSOR RANGE FAN
styles['MultiPoint:G*F*AXC---'] = ({ geometry }) => {
  const [C, A] = TS.coordinates(geometry)
  const segment = TS.segment([C, A])
  const path = TS.pointBuffer(TS.point(C))(segment.getLength())
  const anchor = TS.point(A)

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: anchor,
      'text-field': ['am ? "RANGE " + am : ""', 'x ? "ALTITUDE " + x : ""'],
      'text-padding': 10,
      'text-clipping': 'line'
    }
  ]
}
