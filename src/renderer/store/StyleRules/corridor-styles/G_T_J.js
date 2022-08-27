import * as R from 'ramda'
import { openArrow } from './commons'

// TASKS / CONTAIN
export default ({ TS, geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()

  const cutout = TS.polygon(R.props([0, 1, 3, 2, 0], [
    ...TS.projectCoordinates(width, angle, coords[0])([[0, 1], [0, -1]]),
    ...TS.projectCoordinates(width, angle, coords[1])([[0, 1], [0, -1]])
  ]))

  const arcs = [width / 2, width / 2.5].map(radius => TS.difference([
    TS.boundary(TS.pointBuffer(TS.endPoint(lineString))(radius)),
    cutout
  ]))

  const spikes = R
    .zip(TS.coordinates(arcs[0]), TS.coordinates(arcs[1]))
    .map(coords => TS.lineString(coords))

  const [p1] = TS.projectCoordinates(width / 2, angle, coords[1])([[1, 0]])

  const path = TS.multiLineString([
    lineString,
    ...TS.geometries(arcs[0]),
    ...spikes,
    openArrow(TS, resolution, angle, coords[1])
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: TS.point(p1),
      'text-field': '"C"',
      'text-padding': 5,
      'text-rotate': TS.rotation(segment)
    }
  ]
}
