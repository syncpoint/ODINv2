import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { fenceO, fencePoints } from './commons'
import { PI_OVER_2 } from '../../../../shared/Math'

// DOUBLE STRAND CONCERTINA
styles['LineString:G*M*OWCD--'] = ({ resolution, geometry }) => {
  const width = resolution * 7
  const segments = TS.segments(geometry)
  const startSegment = R.head(segments)
  const endSegment = R.last(segments)

  const startPoint = TS.projectCoordinate(
    TS.coordinate(TS.startPoint(geometry))
  )([startSegment.angle() + PI_OVER_2, width / 2])

  const endPoint = TS.projectCoordinate(
    TS.coordinate(TS.endPoint(geometry))
  )([endSegment.angle() + PI_OVER_2, width / 2])

  const buffer = TS.singleSidedLineBuffer(geometry)(width)
  const path = TS.difference([
    TS.boundary(buffer),
    TS.pointBuffer(TS.point(startPoint))(width / 2),
    TS.pointBuffer(TS.point(endPoint))(width / 2)
  ])

  return [
    { id: 'style:2525c/fence-stroke', geometry: path },
    ...fencePoints(geometry, resolution, 16)
      .map(options => [...options, [0, -8]])
      .map(fenceO)
  ]
}
