import { closedArrow } from './commons'

export default ({ TS, geometry, resolution }) => {
  const [lineString, point] = TS.geometries(geometry)
  const width = 2 * TS.segment([TS.startPoint(lineString), point].map(TS.coordinate)).getLength()
  const coords = TS.coordinates(lineString)
  const segment = TS.segment(coords)
  const angle = segment.angle()
  const arrows = TS
    .projectCoordinates(width / 2, angle, coords[1])([[0, 1], [0, -1]])
    .map(point => closedArrow(TS, resolution, angle, point))

  const distance = resolution * 8
  const d = 1 / Math.sqrt(2)
  const [p00, p01, p10, p11] = TS.projectCoordinates(distance, angle, coords[0])(
    [[-d, d], [d, d], [-d, -d], [d, -d]]
  )

  const path = TS.collect([
    TS.difference([
      TS.boundary(TS.lineBuffer(lineString)(width / 2)),
      TS.pointBuffer(TS.endPoint(lineString))(width / 2),
      TS.pointBuffer(TS.startPoint(lineString))(distance),
      ...arrows
    ]),
    TS.lineString([p00, p01]),
    TS.lineString([p10, p11])
  ])

  return [
    { id: 'style:2525c/solid-fill', geometry: TS.union(arrows) },
    { id: 'style:2525c/solid-stroke', geometry: path }
  ]
}
