import * as R from 'ramda'
import { arrowCoordinates } from './commons'

// AXIS OF ADVANCE / SUPPORTING ATTACK
export default ({ TS, geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const segments = TS.segments(lineString)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (3 / 4))
  if (arrowRatio < 1) throw new Error('segment too short')

  const [sx, sy] = [3 / 4, 1]
  const aps = arrowCoordinates(TS, width, lineString)([
    [0, 0], [sx, sy], [sx, -sy], [sx, 0]
  ])

  const arrow = TS.polygon(R.props([0, 2, 1, 0], aps))
  const centerline = TS.lineString([...R.init(lineString.getCoordinates()), aps[3]])
  const buffer = TS.simpleBuffer(TS.lineBuffer(centerline)(width / 2))(1)
  const difference = TS.difference([
    TS.union([buffer, arrow]).getBoundary(),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2)
  ])

  return [{ id: 'style:2525c/solid-stroke', geometry: difference }]
}
