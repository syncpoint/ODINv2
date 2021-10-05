import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// FOXHOLE, EMPLACEMENT OR WEAPON SITE
styles['LineString:G*M*SW----'] = ({ geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()
  const fractions = [[0, 0.18], [0, 0], [1, 0], [1, 0.18]]
  const xs = TS.projectCoordinates(length, angle, coords[0])(fractions)
  const path = TS.lineString(R.props([0, 1, 2, 3], xs))
  return [{ id: 'style:2525c/default-stroke', geometry: path }]
}
