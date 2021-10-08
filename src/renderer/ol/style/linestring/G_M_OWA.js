import { styles } from '../styles'
import { fenceX, fencePoints } from './commons'

// DOUBLE APRON FENCE
styles['LineString:G*M*OWA---'] = ({ resolution, geometry }) => {
  return [
    { id: 'style:2525c/fence-stroke', geometry },
    ...fencePoints(geometry, resolution, 24).map(fenceX)
  ]
}
