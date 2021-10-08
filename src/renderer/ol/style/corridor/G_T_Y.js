import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'

// TASKS / BYPASS
styles['LineString:Point:G*T*Y-----'] = ({ geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const [p0, p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])

  const path = TS.multiLineString([
    ...TS.geometries(TS.difference([
      TS.boundary(TS.lineBuffer(lineString)(width / 2)),
      TS.pointBuffer(TS.endPoint(lineString))(width / 2)
    ])),
    openArrow(resolution, angle, p0),
    openArrow(resolution, angle, p1)
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: TS.startPoint(lineString),
      'text-field': '"B"',
      'text-padding': 5,
      'text-rotate': TS.rotation(segment)
    }
  ]
}
