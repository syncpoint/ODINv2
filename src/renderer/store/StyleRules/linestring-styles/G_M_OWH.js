import * as R from 'ramda'
import { fenceX, fencePoints } from './commons'

export default context => {
  const { TS, resolution, geometry } = context
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
    ...fencePoints(24, context).map(fenceX(context))
  ]
}
