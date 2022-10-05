import * as R from 'ramda'
import { fenceO, fencePoints } from './commons'

export default context => {
  const { TS, PI_OVER_2, resolution, geometry } = context
  const width = resolution * 11
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
    ...fencePoints(24, context)
      .map(options => [...options, [0, -8]])
      .map(fenceO(context))
  ]
}
