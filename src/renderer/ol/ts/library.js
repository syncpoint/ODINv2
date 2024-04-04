import * as R from 'ramda'
import Angle from 'jsts/org/locationtech/jts/algorithm/Angle.js'
import Centroid from 'jsts/org/locationtech/jts/algorithm/Centroid.js'
import ConvexHull from 'jsts/org/locationtech/jts/algorithm/ConvexHull.js'
import MinimumDiameter from 'jsts/org/locationtech/jts/algorithm/MinimumDiameter.js'
import Coordinate from 'jsts/org/locationtech/jts/geom/Coordinate.js'
import Point from 'jsts/org/locationtech/jts/geom/Point.js'
import Envelope from 'jsts/org/locationtech/jts/geom/Envelope.js'
import Geometry from 'jsts/org/locationtech/jts/geom/Geometry.js'
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory.js'
import LineSegment from 'jsts/org/locationtech/jts/geom/LineSegment.js'
import LineString from 'jsts/org/locationtech/jts/geom/LineString.js'
import Polygon from 'jsts/org/locationtech/jts/geom/Polygon.js'
import AffineTransformation from 'jsts/org/locationtech/jts/geom/util/AffineTransformation.js'
import LengthIndexedLine from 'jsts/org/locationtech/jts/linearref/LengthIndexedLine.js'
import BufferOp from 'jsts/org/locationtech/jts/operation/buffer/BufferOp.js'
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp.js'
import RelateOp from 'jsts/org/locationtech/jts/operation/relate/RelateOp.js'
import * as Flatten from '@flatten-js/core'

import BufferParameters from 'jsts/org/locationtech/jts/operation/buffer/BufferParameters.js'

export const isNumber = v => typeof v === 'number'
export const isArray = Array.isArray
export const isCoordinate = v => v instanceof Coordinate
export const isPoint = v => v instanceof Point
export const isLineSegment = v => v instanceof LineSegment
export const isLineString = v => v instanceof LineString
export const isEnvelope = v => v instanceof Envelope
export const isPolygon = v => v instanceof Polygon

const Types = {
  isNumber,
  isArray,
  isCoordinate,
  isPoint,
  isLineSegment,
  isLineString,
  isEnvelope,
  isPolygon
}

/**
 * CAP_ROUND: 1 (DEFAULT)
 * CAP_FLAT: 2
 * CAP_SQUARE: 3 (aka CAP_BUTT)
 *
 * JOIN_ROUND: 1
 * JOIN_MITRE: 2
 * JOIN_BEVEL: 3
 *
 * DEFAULT_MITRE_LIMIT: 5
 * DEFAULT_QUADRANT_SEGMENTS: 8
 * DEFAULT_SIMPLIFY_FACTOR: 0.01
 *
 * REFERENCE: https://locationtech.github.io/jts/javadoc/org/locationtech/jts/operation/buffer/BufferParameters.html
 */

const geometryFactory = new GeometryFactory()

/**
 * buffer :: options -> geometry -> distance -> geometry
 * NOTE: jst/geom/Geometry#buffer() only exposes partial BufferOp/BufferParameters API.
 */
export const buffer = (opts = {}) => geometry => distance => {
  // NOTE: 3-ary form not supported, use either 0, 1, 2 or 4 arguments.
  // SEE: https://locationtech.github.io/jts/javadoc/org/locationtech/jts/operation/buffer/BufferParameters.html
  const params = new BufferParameters(
    opts.quadrantSegments || BufferParameters.DEFAULT_QUADRANT_SEGMENTS,
    opts.endCapStyle || BufferParameters.CAP_ROUND,
    opts.joinStyle || BufferParameters.JOIN_BEVEL,
    opts.mitreLimit || BufferParameters.DEFAULT_MITRE_LIMIT
  )

  if (opts.singleSided) params.setSingleSided(true)

  return BufferOp.bufferOp(geometry, distance, params)
}

/**
 * pointBuffer :: geometry -> distance -> geometry
 */
export const pointBuffer = buffer()

/**
 * lineBuffer :: geometry -> distance -> geometry
 */
export const lineBuffer = buffer({
  joinStyle: BufferParameters.JOIN_ROUND,
  endCapStyle: BufferParameters.CAP_FLAT
})

/**
 * singleSidedLineBuffer :: geometry -> distance -> geometry
 */
export const singleSidedLineBuffer = buffer({
  joinStyle: BufferParameters.JOIN_ROUND,
  endCapStyle: BufferParameters.CAP_FLAT,
  singleSided: true
})

/**
 * simpleBuffer :: geometry -> distance -> geometry
 */
export const simpleBuffer = buffer({
  endCapStyle: BufferParameters.CAP_ROUND
})

/**
 * polygon :: jts.geom.Coordinate m => [m] -> jts.geom.Polygon
 */
export const polygon = coordinates => geometryFactory.createPolygon(coordinates)

/**
 * segment :: jts.geom.Coordinate m => [m, m] => jts.geom.LineSegment
 * segment :: jts.geom.Coordinate m => (m, m) => jts.geom.LineSegment
 * segment :: jts.geom.LineSegment -> jts.geom.LineSegment
 * segment :: jts.geom.LineString -> jts.geom.LineSegment
 */
export const segment = (...args) => {
  switch (args.length) {
    case 1: return Types.isLineSegment(args[0])
      ? args[0] // jts.geom.LineSegment
      : Types.isLineString(args[0])
        ? segment(args[0].getCoordinates()) // jts.geom.LineString
        : new LineSegment(args[0][0], args[0][1]) // [m, m]
    case 2: return new LineSegment(args[0], args[1]) // (m, m)
    // handle map(current, index, array):
    case 3: return segment(args[0])
  }
}

/**
 * normalSegment :: jts.geom.LineSegment -> jts.geom.LineSegment
 * normalSegment :: jts.geom.LineString -> jts.geom.LineSegment
 */
export const normalSegment = s => {
  if (Types.isLineString(s)) return normalSegment(segment(s))
  else {
    const { p0, p1 } = s
    const center = s.midPoint()
    const dx = center.y + (p1.x - p0.x)
    const dy = center.x - (p1.y - p0.y)
    return segment(center, coordinate([dy, dx]))
  }
}

/**
 * midPoint :: jts.geom.LineString -> jts.geom.Coordinate
 * midPoint :: jts.geom.LineSegment -> jts.geom.Coordinate
 */
export const midPoint = x => {
  if (Types.isLineSegment(x)) return midPoint(lineString(x))
  else {
    const indexedLine = lengthIndexedLine(x)
    return indexedLine.extractPoint(0.5 * indexedLine.getEndIndex())
  }
}

/**
 * extendSegment :: Number -> Number -> jts.geom.LineSegment -> jts.geom.LineSegment
 */
export const extendSegment = R.curry((fa, fb, s) => {
  const length = s.getLength()
  const angle = s.angle()
  return segment(
    projectCoordinates(length * fa, angle, s.p0)([[1, 0]])[0],
    projectCoordinates(length * fb, angle, s.p1)([[1, 0]])[0]
  )
})

/**
 * lineString :: jts.geom.LineSegment -> jts.geom.LineString
 * lineString :: [jts.geom.Coordinate] -> jts.geom.LineString
 * lineString :: ...[jts.geom.Coordinate] -> jts.geom.LineString
 */
export const lineString = (...args) => {
  if (args.length === 1) {
    if (Types.isLineSegment(args[0])) return args[0].toGeometry(geometryFactory)
    else if (Types.isArray(args[0])) return geometryFactory.createLineString(args[0])
  } else return geometryFactory.createLineString([...args])
}

/**
 * multiLineString :: [jts.geom.LineString] -> jts.geom.MultiLineString
 */
export const multiLineString = lineStrings => geometryFactory.createMultiLineString(lineStrings)

/**
 * point :: jts.geom.Coordinate -> jts.geom.Point
 * point :: Flatten.Point -> jts.geom.Point
 */
export const point = coordinate => {
  if (Types.isCoordinate(coordinate)) return geometryFactory.createPoint(coordinate)
  else return point(new Coordinate(coordinate.x, coordinate.y))
}

/**
 * multiPoint :: [jts.geom.Point] -> jts.geom.MultiPoint
 * multiPoint :: [jts.geom.Coordinate] -> jts.geom.MultiPoint
 */
export const multiPoint = points =>
  Types.isPoint(points[0])
    ? geometryFactory.createMultiPoint(points)
    : multiPoint(points.map(point))

/**
 * lengthIndexedLine :: jts.geom.LineString -> jts.linearref.LengthIndexedLine
 * lengthIndexedLine :: jts.geom.LinearRing -> jts.linearref.LengthIndexedLine
 */
export const lengthIndexedLine = geometry => new LengthIndexedLine(geometry)

/**
 * segments :: jts.geom.LineString -> [jts.geom.LineSegment]
 */
export const segments = lineString => R
  .aperture(2, coordinates(lineString))
  .map(segment)

/**
 * collect :: [jts.geom.Geometry] -> jts.geom.GeometryCollection
 */
export const collect = geometries => geometryFactory.createGeometryCollection(geometries)

/**
 * coordinates :: jts.geom.Geometry -> [jts.geom.Coordinate]
 * coordinates :: [jts.geom.Geometry] -> [jts.geom.Coordinate]
 */
export const coordinates = (...args) => {
  if (Types.isArray(args[0])) return args[0].flatMap(coordinates)
  else if (Types.isLineSegment(args[0])) return [args[0].getCoordinate(0), args[0].getCoordinate(1)]
  return args[0].getCoordinates()
}

/**
 * coordinate :: jts.geom.Point -> jts.geom.Coordinate
 * coordinate :: Flatten.Point -> jts.geom.Coordinate
 * coordinate :: [Number, Number] -> jts.geom.Coordinate
 * coordinate :: Number -> Number -> jts.geom.Coordinate
 */
export const coordinate = (...args) => {
  if (args[0] instanceof Geometry) return args[0].getCoordinate()
  else if (args[0] instanceof Flatten.Point) return new Coordinate(args[0].x, args[0].y)
  else if (Types.isArray(args[0])) return coordinate(...args[0])
  else if (args.length === 2) {
    if (args.every(Types.isNumber)) return new Coordinate(args[0], args[1])
    else return undefined
  } else return undefined
}

/**
 * boundary :: jts.geom.Geometry -> jts.geom.Geometry
 */
export const boundary = geometry => geometry.getBoundary()

/**
 * union :: [jts.geom.Geometry] -> jts.geom.Geometry
 */
export const union = geometries => geometries.reduce(OverlayOp.union)

/**
 * difference :: [jts.geom.Geometry] -> jts.geom.Geometry
 */
export const difference = geometries => geometries.reduce(OverlayOp.difference)

/**
 * intersection :: [jts.geom.Geometry] -> jts.geom.Geometry
 */
export const intersection = geometries => geometries.reduce(OverlayOp.intersection)

/**
 * makePoint :: jts.geom.Coordinate -> flatten.Point
 * makePoint :: jts.geom.Point -> flatten.Point
 */
const makePoint = arg =>
  Types.isCoordinate(arg)
    ? Flatten.point(arg.x, arg.y)
    : makePoint(coordinate(arg))

/**
 * makeShape :: jts.geom.Geometry -> flatten.Shape
 * makeShape :: jts.geom.LineSegment -> flatten.Shape
 * makeShape :: (jts.geom.Coordinate, Number) -> flatten.Circle
 * makeShape :: (jts.geom.Point, Number) -> flatten.Circle
 */
export const makeShape = (...args) => {
  if (args.length === 1) {
    const arg = args[0]
    // 1-arg form directly converts supported geometry.
    return R.cond([
      [Types.isLineSegment, ({ p0, p1 }) => Flatten.segment(p0.x, p0.y, p1.x, p1.y)],
      [Types.isLineString, lineString => Flatten.segment(...lineString.getCoordinates().map(makePoint))],
      [Types.isCoordinate, ({ x, y }) => Flatten.point(x, y)],

      [R.T, R.identity(undefined)]
    ])(arg)
  } else {
    // 2-args form is reserved for circles;
    // either point/radius or coordinate/radius.
    return Flatten.circle(makePoint(args[0]), args[1])
  }
}

/**
 * intersectCircle :: jts.geom.Coordinate -> Number -> jts.geom.Geometry -> [jts.geom.Coordinate]
 */
export const intersectCircle = R.curry((center, radius, geometry) => {
  const ps = makeShape(geometry).intersect(makeShape(center, radius))
  return ps.map(coordinate)
})

/**
 * distance :: jts.geom.Coordinate -> jts.geom.LineSegment -> Number
 */
export const distance = (a, b) => {
  // distanceTo :: Flatten.Shape -> [Number, Flatten.Segment]
  const [distance] = makeShape(a).distanceTo(makeShape(b))
  return distance
}

/**
 * startPoint :: jts.geom.Geometry -> jts.geom.Point
 */
export const startPoint = geometry => geometry.getStartPoint()

/**
 * endPoint :: jts.geom.Geometry -> jts.geom.Point
 */
export const endPoint = geometry => geometry.getEndPoint()

/**
 * minimumRectangle -> jts.geom.Geometry -> jts.geom.Polygon
 */
export const minimumRectangle = geometry => MinimumDiameter.getMinimumRectangle(geometry)

/**
 * geometries :: jts.geom.GeometryCollection -> [jts.geom.Geometry]
 */
export const geometries = geometryCollection => R
  .range(0, geometryCollection.getNumGeometries())
  .map(i => geometryCollection.getGeometryN(i))

/**
 * translate :: (Number -> jts.geom.Geometry) -> Number -> jts.geom.Geometry
 */
export const translate = (angle, geometry) => distance => {
  const α = Angle.PI_TIMES_2 - angle
  const [tx, ty] = [-Math.cos(α) * distance, Math.sin(α) * distance]
  const transform = AffineTransformation.translationInstance(tx, ty)
  const translated = geometry.copy()
  translated.apply(transform)
  return translated
}

export const translateX = R.curry((distance, angle, geometry) => {
  // LineSegment is not a geometry: convert to LineString
  if (Types.isLineSegment(geometry)) {
    const line = lineString(geometry)
    const translated = translateX(distance, angle, line)
    return segment(translated.getCoordinates())
  } else {
    const α = Angle.PI_TIMES_2 - angle
    const [tx, ty] = [-Math.cos(α) * distance, Math.sin(α) * distance]
    const transform = AffineTransformation.translationInstance(tx, ty)
    const translated = geometry.copy()
    translated.apply(transform)
    return translated
  }
})

/**
 * reflect :: Number n => (n, n, n, n) -> jts.geom.Geometry -> jts.geom.Geometry
 */
export const reflect = (x0, y0, x1, y1) => geometry => {
  const transform = AffineTransformation.reflectionInstance(x0, y0, x1, y1)
  const translated = geometry.copy()
  translated.apply(transform)
  return translated
}

/**
 * projectCoordinate :: jts.geom.Coordinate -> [angle, distance] -> jts.geom.Coordinate
 */
export const projectCoordinate = ({ x, y }) => ([angle, distance]) => new Coordinate(
  x + Math.cos(angle) * distance,
  y + Math.sin(angle) * distance
)

export const projectCoordinateX = ([angle, distance]) => ({ x, y }) => new Coordinate(
  x + Math.cos(angle) * distance,
  y + Math.sin(angle) * distance
)

export const projectCoordinateY = R.curry(({ x, y }, angle, distance) => new Coordinate(
  x + Math.cos(angle) * distance,
  y + Math.sin(angle) * distance
))

/**
 * projectCoordinates :: Number n, jts.geom.Coordinate m => (n, n, m) -> [n] -> [m]
 */
export const projectCoordinates = (distance, angle, coordinate) => fractions =>
  fractions
    .map(cs => cs.map(c => c * distance))
    .map(([a, b]) => [angle - Math.atan2(b, a), Math.hypot(a, b)])
    .map(projectCoordinate(coordinate))

/**
 * segmentize :: (jts.geom.LineSegment, Number) -> [jts.geom.Coordinate]
 */
export const segmentize = (segment, n) => R
  .range(0, n + 1)
  .map(i => segment.pointAlong(i / n))

/**
 * Segment.angle() - COUNTERCLOCKWISE
 *
 *           π/2
 *            |
 *  +/- π ----+---- +/- 0
 *            |
 *         - π/2
 *
 *
 * Text rotation - CLOCKWISE
 *
 *          upright
 *           +/- 0
 *             |
 *  - π/2 -----+----- π/2
 *  slanted    |  slanted
 *  backwards  |  fowards
 *             π
 *           upside
 *           down
 */

/**
 * rotation :: jst.geom.LineSegment -> Number
 */
export const rotation = segment => Angle.normalize(Angle.PI_TIMES_2 - segment.angle())

export const normalizePositive = angle => Angle.normalizePositive(angle)

/**
 * arc :: jts.geom.Coordinate m, Number n => (m, n, n, n, n) -> [m]
 */
export const arc = ({ x, y }, radius, α1, α2, n) => R.range(0, n)
  .map(i => α1 - α2 / n * i)
  .map(α => [x + radius * Math.cos(α), y + radius * Math.sin(α)])
  .map(coordinate)

/**
 * centroid :: jts.geom.Geometry -> jts.geom.Coordinate
 */
export const centroid = geometry => Centroid.getCentroid(geometry)


/**
 * points :: jts.geom.Point -> [jts.geom.Point]
 * points :: jts.geom.MultiPoint -> [jts.geom.Point]
 * points :: jts.geom.LineString -> [jts.geom.Point]
 * points :: jts.geom.LinearRing -> [jts.geom.Point]
 * points :: jts.geom.Polygon -> [jts.geom.Point]
 * points :: jts.geom.GeometryCollection -> [jts.geom.Point]
 */
export const points = geometry => {
  const type = geometry.getGeometryType()

  switch (type) {
    case 'Point': return [geometry]
    case 'MultiPoint': return geometries(geometry)
    case 'LineString': return R.range(0, geometry.getNumPoints()).map(i => geometry.getPointN(i))
    case 'LinearRing': return R.range(0, geometry.getNumPoints()).map(i => geometry.getPointN(i))
    case 'Polygon': return points(geometry.getExteriorRing())
    case 'GeometryCollection': return geometries(geometry).reduce((acc, geometry) => {
      acc.push(...points(geometry))
      return acc
    }, [])
    default: return []
  }
}

/**
 * equals :: jts.geom.Geometry -> jts.geom.Geometry -> Boolean
 * Reference: https://github.com/bjornharrtell/jsts/blob/master/src/org/locationtech/jts/monkey.js
 */
export const equals = (g1, g2) => RelateOp.equalsTopo(g1, g2)

/**
 * intersects :: jts.geom.Geometry -> jts.geom.Geometry -> Boolean
 * Reference: https://github.com/bjornharrtell/jsts/blob/master/src/org/locationtech/jts/monkey.js
 */
export const intersects = (g1, g2) => RelateOp.intersects(g1, g2)

/**
 * convexHull :: jts.geom.Geometry -> jts.geom.Geometry
 * Reference: https://github.com/bjornharrtell/jsts/blob/master/src/org/locationtech/jts/monkey.js
 */
export const convexHull = geometry => new ConvexHull(geometry).getConvexHull()
