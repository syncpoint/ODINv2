import { styles } from '../styles'
import { fenceX, fencePoints } from './commons'

// SINGLE FENCE
styles['LineString:G*M*OWS---'] = ({ resolution, geometry }) => {
  return [
    { id: 'style:2525c/fence-stroke', geometry },
    ...fencePoints(geometry, resolution, 38).map(fenceX)
  ]
}
