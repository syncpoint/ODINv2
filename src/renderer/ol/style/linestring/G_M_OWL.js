import { styles } from '../styles'
import { fenceX, fencePoints } from './commons'

// LOW WIRE FENCE
styles['LineString:G*M*OWL---'] = ({ resolution, geometry }) => {
  return [
    { id: 'style:2525c/fence-stroke', geometry },
    ...fencePoints(geometry, resolution, 24)
      .map(options => [...options, [0, -7]])
      .map(fenceX)
  ]
}
