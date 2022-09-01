import * as R from 'ramda'

export default ({ TS, geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)

  const A = (() => {
    const project = TS.projectCoordinates(width / 2, segment.angle(), coords[0])
    const ps = project([[-0.25, 1.25], [0, 1], [0, -1], [-0.25, -1.25]])
    return TS.lineString(R.props([0, 1, 2, 3], ps))
  })()

  const B = (() => {
    const project = TS.projectCoordinates(resolution * 8, segment.angle(), coords[1])
    const ps = project([[-1, 0.75], [0, 0], [-1, -0.75]])
    return TS.lineString(R.props([0, 1, 2], ps))
  })()

  const path = TS.collect([geometry, A, B])
  return [
    { id: 'style:2525c/default-stroke', geometry: path }
  ]
}
