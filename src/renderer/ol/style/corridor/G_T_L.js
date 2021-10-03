import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'

const withdrawLike = text => ({ geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const orientation = segment.orientationIndex(TS.coordinate(point))
  const angle = segment.angle()
  const midPoint = TS.point(segment.midPoint())

  const [px] = TS.projectCoordinates(width / 4, angle, coords[0])([[0, -orientation]])
  const [p0] = TS.projectCoordinates(width / 2, angle, coords[0])([[0, -orientation]])
  const [p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[0, -orientation]])

  const arc = TS.difference([
    TS.boundary(TS.pointBuffer(TS.point(px))(width / 4)),
    TS.polygon([coords[0], p0, p1, coords[1], coords[0]])
  ])

  const path = TS.multiLineString([
    lineString,
    openArrow(resolution, angle, coords[1]),
    ...TS.geometries(arc)
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: midPoint,
      'text-field': text,
      'text-anchor': 'center',
      'text-justify': 'end',
      'text-padding': 3,
      'text-rotate': TS.rotation(segment)
    }
  ]
}

styles['LineString:Point:G*T*L-----'] = withdrawLike('"D"') // TASKS / DELAY
styles['LineString:Point:G*T*M-----'] = withdrawLike('"R"') // TASKS / RETIREMENT
styles['LineString:Point:G*T*W-----'] = withdrawLike('"W"') // TASKS / WITHDRAW
styles['LineString:Point:G*T*WP----'] = withdrawLike('"WP"') // WITHDRAW UNDER PRESSURE
