import * as R from 'ramda'
import { openArrow } from './commons'

export default ({ TS, geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const midPoint = TS.point(segment.midPoint())

  const interpolate = ([fraction, segment]) => {
    segment.p1 = segment.pointAlong(fraction)
    return segment
  }

  const segments = R.zip([0.5, 0.75, 1], R.splitEvery(2, R.props([2, 5, 0, 3, 1, 4], [
    coords[0], ...TS.projectCoordinates(width / 2, angle, coords[0])([[0, 1], [0, -1]]),
    coords[1], ...TS.projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
  ])))
    .map(([fraction, coords]) => [fraction, TS.segment(coords)])
    .map(interpolate)

  const arrows = segments.map(segment => openArrow(TS, resolution, angle, segment.p1))
  const path = TS.multiLineString([
    ...segments.map(segment => TS.lineString(segment)),
    TS.lineString([segments[0].p0, segments[2].p0]),
    TS.lineString([segments[1].pointAlong(-0.25), segments[1].p0]),
    ...arrows
  ])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: midPoint,
      'text-field': '"D"',
      'text-padding': 5,
      'text-rotate': TS.rotation(segment)
    }
  ]
}
