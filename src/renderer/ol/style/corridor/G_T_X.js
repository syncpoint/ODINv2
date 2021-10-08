import { styles } from '../styles'
import * as TS from '../../ts'
import { openArrow } from './commons'

// TASKS / CLEAR
styles['LineString:Point:G*T*X-----'] = ({ geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const [p00, p01, p10, p11, p20, p21] = [
    ...TS.projectCoordinates(width / 2, angle, coords[0])([[0, 0.75], [0, -0.75]]),
    ...TS.projectCoordinates(width / 2, angle, coords[1])([[0, 0.75], [0, -0.75], [0, 1], [0, -1]])
  ]

  const arrows = [p10, coords[1], p11].map(coord => openArrow(resolution, angle, coord))
  const path = TS.multiLineString([
    lineString,
    TS.lineString([p00, p10]),
    TS.lineString([p01, p11]),
    TS.lineString([p20, p21]),
    ...arrows
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: TS.point(segment.midPoint()),
      'text-field': '"C"',
      'text-padding': 5,
      'text-rotate': TS.rotation(segment)
    }
  ]
}
