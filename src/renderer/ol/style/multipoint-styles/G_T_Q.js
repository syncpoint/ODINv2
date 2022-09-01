import * as R from 'ramda'

export default ({ TS, DEG2RAD, PI_OVER_2, PI, geometry }) => {
  const delta = 330 * DEG2RAD
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const radius = segment.getLength()

  const quads = 64
  const arcs = [
    TS.arc(coords[0], radius, angle, delta, quads),
    TS.arc(coords[0], 0.8 * radius, angle, delta, quads)
  ]

  const spikes = R.range(1, arcs[0].length - 2)
    .filter(i => i % 2 === 0)
    .map(i => [arcs[0][i], arcs[1][i]])
    .map(coords => TS.lineString(coords))

  const project = TS.projectCoordinates(radius, angle - delta + PI_OVER_2, R.last(arcs[1]))
  const offset = 0.1
  const xs = project([[offset, -offset], [0, 0], [offset, offset]])
  const anchor = TS.point(arcs[1][Math.floor(arcs[0].length / 2)])
  const rotate = TS.rotation(segment) - PI / 12
  const path = TS.union([TS.lineString(xs), ...spikes, TS.lineString(arcs[1])])

  return [
    { id: 'style:2525c/default-stroke', geometry: path },
    {
      id: 'style:default-text',
      geometry: anchor,
      'text-field': '"R"',
      'text-rotate': rotate,
      'text-padding': 5
    }
  ]
}
