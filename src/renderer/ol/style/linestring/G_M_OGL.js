import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { PI_OVER_3 } from '../../../../shared/Math'


const teeth = direction => (geometry, resolution) => {
  const width = resolution * 10
  const line = TS.lengthIndexedLine(geometry)
  const count = Math.floor(line.getEndIndex() / (width * 2))
  const offset = (line.getEndIndex() - 2 * count * width) / 2

  return R
    .aperture(2, R.range(0, count + 1).map(i => offset + 2 * width * i))
    .map(([a, b]) => [
      line.extractPoint(a),
      line.extractPoint(a + width / 2),
      line.extractPoint(b - width / 2),
      line.extractPoint(b)
    ])
    .map(([a, b, c, d]) => [a, b, c, d, TS.segment([b, c]).angle()])
    .map(([a, b, c, d, angle]) => [a, b, c, d, TS.projectCoordinate(b)([angle + direction * PI_OVER_3, width])])
    .map(([a, b, c, d, x]) => TS.lineString([a, b, x, c, d]))
}

// OBSTACLES / GENERAL / LINE
styles['LineString:G*M*OGL---'] = ({ resolution, geometry }) => {
  const path = TS.collect(teeth(1)(geometry, resolution))
  return [{ id: 'style:2525c/solid-fill', geometry: path }]
}

// ANTITANK WALL
styles['LineString:G*M*OAW---'] = ({ resolution, geometry }) => {
  const path = TS.collect(teeth(-1)(geometry, resolution))
  return [{ id: 'style:2525c/solid-fill', geometry: path }]
}

