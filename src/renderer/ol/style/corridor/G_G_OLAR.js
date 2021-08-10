import * as R from 'ramda'
import { styles } from '../styles'
import * as TS from '../../ts'
import { arrowCoordinates } from './commons'

// AXIS OF ADVANCE / ATTACK, ROTARY WING
styles['G*G*OLAR--'] = ({ styles, lineString, width }) => {
  const segments = TS.segments(lineString)
  const arrowRatio = Math.min(1, (R.last(segments).getLength() / width) / (3 / 4))
  if (arrowRatio < 1) throw new Error('segment too short')

  const [sx, sy] = [3 / 4, 1]
  const aps = arrowCoordinates(width, lineString)([
    [0, 0], [sx, sy], [sx, sy / 2], [sx, 0], [sx, -sy / 2], [sx, -sy]
  ])

  const bisection = (() => {
    const angle = segment => segment.angle()
    const average = xs => R.sum(xs) / xs.length
    const points = TS.coordinates([lineString])
    const point = TS.point(points[points.length - 2])
    const bearing = average(R.drop(segments.length - 2, segments).map(angle))
    return TS.lineString(TS.coordinates([
      TS.translate(bearing + Math.PI / 2, point)(width),
      TS.translate(bearing - Math.PI / 2, point)(width)
    ]))
  })()

  const buffer = TS.lineBuffer(TS.lineString([...R.init(lineString.getCoordinates()), aps[3]]))(width / 2).buffer(1)

  const intersection = TS.boundary(buffer).intersection(bisection)
  if (
    intersection.getGeometryType() !== 'MultiPoint' ||
    intersection.getNumGeometries() !== 2
  ) throw new Error('bad intersection')

  const crossing = (() => {
    const [p1, p2] = TS.coordinates(intersection)
    let a = TS.lineString([p1, aps[2]])
    let b = TS.lineString([p2, aps[4]])
    if (!a.intersects(b)) {
      a = TS.lineString([p1, aps[4]])
      b = TS.lineString([p2, aps[2]])
    }

    return [a, b]
  })()

  const cross = TS.union(crossing)

  const rotarySymbol = (() => {
    // Move arrow base to crossing intersection point:
    const intersection = crossing[0].intersection(crossing[1])
    const segment = TS.segment([aps[2], aps[4]])
    const mp = segment.midPoint()
    const [tx, ty] = [
      mp.x - intersection.getCoordinate().x,
      mp.y - intersection.getCoordinate().y
    ]

    segment.p0 = new TS.Coordinate(segment.p0.x - tx, segment.p0.y - ty)
    segment.p1 = new TS.Coordinate(segment.p1.x - tx, segment.p1.y - ty)
    if (segment.angle() < 0) segment.reverse()

    const points = arrowCoordinates(width, TS.lineString(segment))([
      [5 / 26, 5 / 26], [0, 0], [5 / 26, -5 / 26],
      [1, 5 / 26], [1, -5 / 26]
    ])

    const verticalLines = () => {
      const offset = TS.segment([mp, TS.coordinate(intersection)]).getLength() * 0.5
      return [+Math.PI, -Math.PI]
        .map(angle => TS.translate(segment.angle() + angle / 2, TS.lineString(segment))(offset))
        .map(line => line.intersection(cross))
        .map(TS.coordinates)
        .map(coords => TS.lineString(coords))
    }

    return TS.collect([
      TS.lineString(segment),
      TS.lineString(R.props([0, 1, 2], points)),
      TS.lineString(R.props([3, 4], points)),

      // If there are intersection problems with
      // construction of the two vertical line, we simply drop them.
      TS.collect(R.tryCatch(verticalLines, () => [])())
    ])
  })()

  return [
    styles.solidStroke(rotarySymbol),
    styles.solidStroke(TS.union([
      cross,
      TS.lineString(R.props([4, 5, 0, 1, 2], aps)),
      TS.difference([
        TS.boundary(buffer),
        TS.polygon(R.props([0, 1, 5, 0], aps)),
        TS.pointBuffer(TS.startPoint(lineString))(width / 2),
        TS
          .geometryCollection([bisection, TS.point(aps[1]), TS.point(aps[5])])
          .convexHull()
      ])
    ]))
  ]
}
