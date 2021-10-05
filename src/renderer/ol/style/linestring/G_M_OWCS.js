import { styles } from '../styles'
import { fenceO, fencePoints } from './commons'

// SINGLE CONCERTINA
styles['LineString:G*M*OWCS--'] = ({ resolution, geometry }) => {
  return [
    { id: 'style:2525c/fence-stroke', geometry },
    ...fencePoints(geometry, resolution, 16)
      .map(options => [...options, [0, -8]])
      .map(fenceO)
  ]
}
