import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { PI } from '../../../../shared/Math'

// MINE CLUSTER
styles['LineString:G*M*OMC---'] = ({ geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const center = segment.midPoint()
  const radius = segment.getLength() / 2

  const points = R.range(0, 17)
    .map(i => PI / 16 * i + angle)
    .map(angle => TS.projectCoordinate(center)([angle, radius]))

  const path = TS.collect([geometry, TS.lineString(points)])
  return [{ id: 'style:2525c/dashed-stroke', geometry: path }]
}
