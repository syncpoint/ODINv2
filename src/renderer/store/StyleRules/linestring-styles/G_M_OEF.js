import * as R from 'ramda'

export default ({ TS, resolution, geometry }) => {
  const coords = TS.coordinates(geometry)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const length = segment.getLength()

  const xs = TS.projectCoordinates(length, angle, coords[0])([
    [1, 0], [0.9, -0.04], [0.9, 0], [0.9, 0.04], [1, 0]
  ])

  const [p0, p1] = [segment.pointAlong(0.2), segment.pointAlong(0.8)]
  const [p00, p01, p10, p11] = [
    ...TS.projectCoordinates(resolution * 8, angle, p0)([[0, -1], [0, 1]]),
    ...TS.projectCoordinates(resolution * 8, angle, p1)([[0, -1], [0, 1]])
  ]

  const n = Math.floor(length / (resolution * 10))
  const x = R.flatten(R.zip(
    TS.segmentize(TS.segment(p00, p10), n).filter((_, i) => i % 2 === 0),
    TS.segmentize(TS.segment(p01, p11), n).filter((_, i) => i % 2 !== 0)
  ))

  const path = TS.collect([
    TS.lineString([coords[0], p0]),
    TS.lineString([p0, ...x, p1]),
    TS.lineString([p1, xs[2]])
  ])

  return [
    { id: 'style:2525c/solid-stroke', geometry: path },
    { id: 'style:2525c/solid-fill', geometry: TS.polygon(xs) }
  ]
}
