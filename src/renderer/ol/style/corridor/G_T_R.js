import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'
import { PI } from '../../../../shared/Math'

// TASKS / RELIEF IN PLACE (RIP)
styles['LineString:Point:G*T*R-----'] = ({ geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const orientation = segment.orientationIndex(TS.coordinate(point))
  const angle = segment.angle()
  const midPoint = TS.point(segment.midPoint())

  const [px] = TS.projectCoordinates(width / 4, angle, coords[1])([[0, -orientation]])
  const [p0] = TS.projectCoordinates(width / 2, angle, coords[0])([[0, -orientation]])
  const [p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, -orientation]])

  const arc = TS.difference([
    TS.boundary(TS.pointBuffer(TS.point(px))(width / 4)),
    TS.polygon([coords[0], p0, p1, coords[1], coords[0]])
  ])

  const path = TS.multiLineString([
    lineString,
    TS.lineString([p1, p0]),
    openArrow(resolution, angle, coords[1]),
    openArrow(resolution, angle + PI, p0),
    ...TS.geometries(arc)
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: midPoint,
      'text-field': '"RIP"',
      'text-padding': 3,
      'text-rotate': TS.rotation(segment)
    }
  ]
}
