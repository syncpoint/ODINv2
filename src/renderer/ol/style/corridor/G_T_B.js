import { styles } from '../styles'
import * as TS from '../../ts'

// TASKS / BLOCK
styles['LineString:Point:G*T*B-----'] = ({ geometry }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const fractions = [[0, 1], [0, -1]]
  const midPoint = TS.point(segment.midPoint())

  const path = TS.multiLineString([
    lineString,
    TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])(fractions))
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: midPoint,
      'text-field': '"B"',
      'text-padding': 5,
      'text-rotate': TS.rotation(segment)
    }
  ]
}
