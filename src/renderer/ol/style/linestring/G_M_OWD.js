import { styles } from '../styles'
import { fenceXX, fencePoints } from './commons'

// DOUBLE FENCE
styles['LineString:G*M*OWD---'] = ({ resolution, geometry }) => {
  return [
    { id: 'style:2525c/fence-stroke', geometry },
    ...fencePoints(geometry, resolution, 48).map(fenceXX)
  ].flat()
}
