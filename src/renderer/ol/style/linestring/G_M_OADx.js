import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { PI_OVER_3 } from '../../../../shared/Math'

const teeth = (geometry, resolution) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(geometry)
  const count = Math.floor(line.getEndIndex() / width)
  const offset = (line.getEndIndex() - count * width) / 2

  return R
    .aperture(2, R.range(0, count + 1).map(i => offset + width * i))
    .map(([a, b]) => [line.extractPoint(a), line.extractPoint(b), line.extractLine(a, b)])
    .map(([a, b, line]) => [a, TS.segment([a, b]).angle(), TS.coordinates(line)])
    .map(([a, angle, coords]) => [TS.projectCoordinate(a)([angle + PI_OVER_3, width]), coords])
    .map(([c, coords]) => TS.polygon([c, ...coords, c]))
}

// ANTITANK DITCH / UNDER CONSTRUCTION
styles['LineString:G*M*OADU--'] = ({ resolution, geometry }) => {
  const path = TS.collect([geometry, ...teeth(geometry, resolution)])
  return [
    { id: 'style:2525c/solid-stroke', geometry: path }
  ]
}

// ANTITANK DITCH / COMPLETE
styles['LineString:G*M*OADC--'] = ({ resolution, geometry }) => {
  const path = TS.collect([geometry, ...teeth(geometry, resolution)])
  return [
    { id: 'style:2525c/solid-fill', geometry: path }
  ]
}
