import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// HALTED CONVOY
styles['LineString:G*S*LCH---'] = ({ geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const xs = TS.projectCoordinates(segment.getLength(), segment.angle(), coords[0])([
    [0, -0.1], [1, -0.1], [1, 0.1], [0, 0.1],
    [1, 0], [1.16, -0.15], [1.16, 0.15]
  ])

  const path = TS.collect([
    TS.polygon(R.props([0, 1, 2, 3, 0], xs)),
    TS.polygon(R.props([4, 5, 6, 4], xs))
  ])

  return [{ id: 'style:2525c/solid-stroke', geometry: path }]
}
