import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { arrowCoordinates } from './commons'

// AXIS OF ADVANCE / MAIN ATTACK
styles['LineString:Point:G*G*OLAGM-'] = ({ geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const segments = TS.segments(lineString)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (3 / 4))
  if (arrowRatio < 1) throw new Error('segment too short')

  const [sx, sy] = [3 / 4, 1]
  const aps = arrowCoordinates(width, lineString)([
    [0, 0], [sx, sy], [sx, sy / 2], [sx / 2, 0], [sx, -sy / 2], [sx, -sy], [sx, 0]
  ])

  const arrow = TS.polygon(R.props([0, 1, 2, 3, 4, 5, 0], aps))
  const arrowBoundary = TS.polygon(R.props([0, 1, 5, 0], aps))

  // Shorten last center line segment to arrow base and calculate buffer.
  // NOTE: Buffer is slightly increased by 1 meter, so union with
  // arrow does not produce gaps.
  const centerline = TS.lineString([...R.init(lineString.getCoordinates()), aps[6]])
  const buffer = TS.lineBuffer(centerline)(width / 2).buffer(1)
  const corridor = TS.difference([
    TS.union([buffer, arrowBoundary]).getBoundary(),
    TS.pointBuffer(TS.startPoint(lineString))(width / 2)
  ])

  const path = TS.union([corridor, arrow])
  return [
    { id: 'style:2525c/default-stroke', geometry: path }
  ]
}
