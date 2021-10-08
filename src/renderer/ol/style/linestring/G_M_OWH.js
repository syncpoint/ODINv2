import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { fenceX, fencePoints } from './commons'

// HIGH WIRE FENCE
styles['LineString:G*M*OWH---'] = ({ resolution, geometry }) => {
  const width = resolution * 10
  const points = TS.points(geometry)
  const buffer = TS.lineBuffer(geometry)(width)
  const path = TS.difference([
    TS.boundary(buffer),
    TS.pointBuffer(R.head(points))(width),
    TS.pointBuffer(R.last(points))(width)
  ])

  return [
    { id: 'style:2525c/fence-stroke', geometry: path },
    ...fencePoints(geometry, resolution, 24).map(fenceX)
  ]
}
