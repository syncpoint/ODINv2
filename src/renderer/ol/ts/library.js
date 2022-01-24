import * as R from 'ramda'
import Angle from 'jsts/org/locationtech/jts/algorithm/Angle.js'
import Centroid from 'jsts/org/locationtech/jts/algorithm/Centroid.js'
import ConvexHull from 'jsts/org/locationtech/jts/algorithm/ConvexHull.js'
import MinimumDiameter from 'jsts/org/locationtech/jts/algorithm/MinimumDiameter.js'
import Coordinate from 'jsts/org/locationtech/jts/geom/Coordinate.js'
import Envelope from 'jsts/org/locationtech/jts/geom/Envelope.js'
import Geometry from 'jsts/org/locationtech/jts/geom/Geometry.js'
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory.js'
import LineSegment from 'jsts/org/locationtech/jts/geom/LineSegment.js'
import Polygon from 'jsts/org/locationtech/jts/geom/Polygon.js'
import AffineTransformation from 'jsts/org/locationtech/jts/geom/util/AffineTransformation.js'
import LengthIndexedLine from 'jsts/org/locationtech/jts/linearref/LengthIndexedLine.js'
import BufferOp from 'jsts/org/locationtech/jts/operation/buffer/BufferOp.js'
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp.js'
import RelateOp from 'jsts/org/locationtech/jts/operation/relate/RelateOp.js'


import BufferParameters from 'jsts/org/locationtech/jts/operation/buffer/BufferParameters.js'

const Types = {
  isNumber: v => typeof v === 'number',
  isArray: Array.isArray,
  isCoordinate: v => v instanceof Coordinate,
  isLineSegment: v => v instanceof LineSegment,
  isEnvelope: v => v instanceof Envelope,
  isPolygon: v => v instanceof Polygon
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
 * segment :: jts.geom.LineSegment Kt => Kt -> Kt
 */
export const segment = (...args) => {
  switch (args.length) {
    case 1: return Types.isLineSegment(args[0]) ? args[0] : new LineSegment(args[0][0], args[0][1])
    case 2: return new LineSegment(args[0], args[1])
    // handle map(current, index, array):
    case 3: return segment(args[0])
  }
}

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
 */
export const point = coordinate => geometryFactory.createPoint(coordinate)

/**
 * multiPoint :: [jts.geom.Point] -> jts.geom.MultiPoint
 */
export const multiPoint = points => geometryFactory.createMultiPoint(points)

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
  else return args[0].getCoordinates()
}

/**
 * coordinate :: jts.geom.Point -> jts.geom.Coordinate
 * coordinate :: [Number, Number] -> jts.geom.Coordinate
 * coordinate :: (Number, Number) -> jts.geom.Coordinate
 */
export const coordinate = (...args) => {
  if (args[0] instanceof Geometry) return args[0].getCoordinate()
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
