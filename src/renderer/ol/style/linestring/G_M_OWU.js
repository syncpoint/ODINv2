import { styles } from '../styles'
import { fenceX, fencePoints } from './commons'

// UNSPECIFIED FENCE
styles['LineString:G*M*OWU---'] = ({ resolution, geometry }) => {
  return fencePoints(geometry, resolution, 16).map(fenceX)
}
