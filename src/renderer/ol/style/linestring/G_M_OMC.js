import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'

// MINE CLUSTER
styles['LineString:G*M*OMC---'] = ({ styles, resolution, lineString }) => {
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const center = segment.midPoint()
  const radius = segment.getLength() / 2

  const points = R.range(0, 17)
    .map(i => Math.PI / 16 * i + angle)
    .map(angle => TS.projectCoordinate(center)([angle, radius]))

  const geometry = TS.collect([lineString, TS.lineString(points)])
  return styles.dashedStroke(geometry, { lineDash: [20, 14] })
}
