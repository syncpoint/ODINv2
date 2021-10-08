import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'

// TASKS / PENETRATE
styles['LineString:Point:G*T*P-----'] = ({ geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const midPoint = TS.point(segment.midPoint())

  const path = TS.multiLineString([
    lineString,
    openArrow(resolution, angle, coords[1]),
    TS.lineString(TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]]))
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: midPoint,
      'text-field': '"P"',
      'text-padding': 5,
      'text-rotate': TS.rotation(segment)
    }
  ]
}
