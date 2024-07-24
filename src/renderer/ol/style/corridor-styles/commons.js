import * as R from 'ramda'

export const arrowCoordinates = (TS, width, line, offset = 1) => {
  const coordinates = R.last(R.aperture(2, TS.coordinates([line])))
  const segment = TS.segment(coordinates)
  const angle = segment.angle()
  const p = coordinates[offset]
  return xs => xs
    .map(([dx, dy]) => [-dx * width, dy * width])
    .map(([dx, dy]) => [Math.sqrt(dx * dx + dy * dy), angle - Math.atan2(dy, dx)])
    .map(([c, α]) => new TS.Coordinate(p.x + Math.cos(α) * c, p.y + Math.sin(α) * c))
}

const arrowPoints = (TS, resolution, angle, point) =>
  TS.projectCoordinates(resolution * 8, angle, point)([[-1, 0.6], [0, 0], [-1, -0.6]])

export const openArrow = (TS, resolution, angle, point) =>
  TS.lineString(R.props([0, 1, 2], arrowPoints(TS, resolution, angle, point)))

export const closedArrow = (TS, resolution, angle, point) =>
  TS.polygon(R.props([0, 1, 2, 0], arrowPoints(TS, resolution, angle, point)))
