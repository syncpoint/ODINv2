import * as R from 'ramda'
import * as jsts from 'jsts'
import * as geom from 'ol/geom'

const K = v => fn => { fn(v); return v }

const Types = {
  isNumber: v => typeof v === 'number',
  isArray: Array.isArray,
  isCoordinate: v => v instanceof jsts.geom.Coordinate,
  isLineSegment: v => v instanceof jsts.geom.LineSegment
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
export const BufferParameters = jsts.operation.buffer.BufferParameters

/**
 * NOTE: jst/Geometry#buffer() only exposes partial BufferOp/BufferParameters API.
 */
const BufferOp = jsts.operation.buffer.BufferOp
export const MinimumDiameter = jsts.algorithm.MinimumDiameter
export const Angle = jsts.algorithm.Angle
export const GeometryFactory = jsts.geom.GeometryFactory
export const AffineTransformation = jsts.geom.util.AffineTransformation
export const Coordinate = jsts.geom.Coordinate
export const LengthIndexedLine = jsts.linearref.LengthIndexedLine
export const geometryFactory = new GeometryFactory()

/**
 * Setup JST/OL parser to convert between JST and OL geometries.
 * REFERENCE: http://bjornharrtell.github.io/jsts/1.6.1/doc/module-org_locationtech_jts_io_OL3Parser.html
 */
const parser = K(new jsts.io.OL3Parser(geometryFactory))(parser => parser.inject(
  geom.Point,
  geom.LineString,
  geom.LinearRing,
  geom.Polygon,
  geom.MultiPoint,
  geom.MultiLineString,
  geom.MultiPolygon,
  geom.GeometryCollection
))

/**
 * JSTS ignores the fact that ol.geom.LinearRing is not supposed to be rendered.
 * We convert LinearRing to equivalent LineString.
 */
/* eslint-disable no-proto */
const convertToLinearRing = parser.__proto__.convertToLinearRing
parser.__proto__.convertToLinearRing = function (linearRing) {
  const geometry = convertToLinearRing.call(this, linearRing)
  return new geom.LineString(geometry.getCoordinates())
}

export const read = olGeometry => parser.read(olGeometry)
export const write = jstGeometry => parser.write(jstGeometry)

export const use = fn => olGeometry => {
  const jstGeometry = fn(read(olGeometry))
  return Array.isArray(jstGeometry)
    ? jstGeometry.map(write)
    : write(jstGeometry)
}

export const buffer = (opts = {}) => geometry => distance => {
  // NOTE: 3-ary form not supported, use either 0, 1, 2 or 4 arguments.
  // SEE: https://locationtech.github.io/jts/javadoc/org/locationtech/jts/operation/buffer/BufferParameters.html
  const params = new BufferParameters(
    opts.quadrantSegments || BufferParameters.DEFAULT_QUADRANT_SEGMENTS,
    opts.endCapStyle || BufferParameters.CAP_ROUND,
    opts.joinStyle || BufferParameters.JOIN_BEVEL,
    opts.mitreLimit || BufferParameters.DEFAULT_MITRE_LIMIT
  )

  return BufferOp.bufferOp(geometry, distance, params)
}

export const pointBuffer = buffer()
export const lineBuffer = buffer({
  joinStyle: BufferParameters.JOIN_ROUND,
  endCapStyle: BufferParameters.CAP_FLAT
})

export const polygon = coordinates => geometryFactory.createPolygon(coordinates)

export const lineString = (...args) => {
  if (args.length === 1) {
    if (Types.isLineSegment(args[0])) return args[0].toGeometry(geometryFactory)
    else if (Types.isArray(args[0])) {
      return geometryFactory.createLineString(args[0])
    }
  } else return geometryFactory.createLineString(...args)
}

export const point = coordinate => geometryFactory.createPoint(coordinate)
export const multiPoint = points => geometryFactory.createMultiPoint(points)
export const lengthIndexedLine = geometry => new LengthIndexedLine(geometry)

/**
 * segment :: geom.LineSegment => geom.LineSegment
 * segment :: [geom.Coordinate, geom.Coordinate] => geom.LineSegment
 * segment :: (geom.Coordinate, geom.Coordinate) => geom.LineSegment
 */
export const segment = (...args) => {
  switch (args.length) {
    case 1: return Types.isLineSegment(args[0]) ? args[0] : new jsts.geom.LineSegment(args[0][0], args[0][1])
    case 2: return new jsts.geom.LineSegment(args[0], args[1])
    // handle map(current, index, array):
    case 3: return segment(args[0])
  }
}

export const segments = lineString => R
  .aperture(2, coordinates(lineString))
  .map(segment)

export const geometryCollection = geometries => geometryFactory.createGeometryCollection(geometries)
export const collect = geometries => geometryFactory.createGeometryCollection(geometries)

export const coordinates = (...args) => {
  if (Types.isArray(args[0])) return args[0].flatMap(coordinates)
  else return args[0].getCoordinates()
}

export const coordinate = (...args) => {
  if (args[0] instanceof jsts.geom.Geometry) return args[0].getCoordinate()
  else if (Types.isArray(args[0])) return coordinate(...args[0])
  else if (args.length === 2) {
    if (args.every(Types.isNumber)) return new Coordinate(args[0], args[1])
    else return undefined
  } else return undefined
}

export const boundary = geometry => geometry.getBoundary()
export const boundaries = geometries => geometries.map(boundary)
export const union = geometries => geometries.reduce((a, b) => a.union(b))
export const difference = geometries => geometries.reduce((a, b) => a.difference(b))
export const intersection = geometries => geometries.reduce((a, b) => a.intersection(b))
export const geometryN = n => geometry => geometry.getGeometryN(n)
export const geometry0 = geometryN(0)
export const startPoint = geometry => geometry.getStartPoint()
export const endPoint = geometry => geometry.getEndPoint()
export const linePoints = line => R.range(0, line.getNumPoints()).map(i => line.getPointN(i))
export const minimumRectangle = geometry => MinimumDiameter.getMinimumRectangle(geometry)
export const endCoordinate = R.compose(coordinate, endPoint)


export const geometries = geometryCollection => R
  .range(0, geometryCollection.getNumGeometries())
  .map(i => geometryCollection.getGeometryN(i))

export const translate = (angle, geometry) => distance => {
  const α = 2 * Math.PI - angle
  const [tx, ty] = [-Math.cos(α) * distance, Math.sin(α) * distance]
  const transform = AffineTransformation.translationInstance(tx, ty)
  const translated = geometry.copy()
  translated.apply(transform)
  return translated
}

export const reflect = (x0, y0, x1, y1) => geometry => {
  const transform = AffineTransformation.reflectionInstance(x0, y0, x1, y1)
  const translated = geometry.copy()
  translated.apply(transform)
  return translated
}

// CCW angle with x-axis [-π ,π] => CW angle with azimuth [0, 2π]
export const angleAzimuth = α => Angle.PI_TIMES_2 - Angle.normalizePositive(α - Angle.PI_OVER_2)

export const projectCoordinate = ({ x, y }) => ([angle, distance]) => new Coordinate(
  x + Math.cos(angle) * distance,
  y + Math.sin(angle) * distance
)

export const projectCoordinates = (distance, angle, point) => fractions =>
  fractions
    .map(cs => cs.map(c => c * distance))
    .map(([a, b]) => [angle - Math.atan2(b, a), Math.hypot(a, b)])
    .map(projectCoordinate(point))

export const segmentize = (segment, n) => R
  .range(0, n + 1)
  .map(i => segment.pointAlong(i / n))

/**
 * bearingDistance :: (geom.LineSegment) => [number, number]
 * bearingDistance :: ([geom.Coordinate, geom.Coordinate]) => [number, number]
 * bearingDistance :: (geom.Coordinate, geom.Coordinate) => [number, number]
 */
export const bearingDistance = (...args) => {
  const s = segment(...args)
  return [Angle.normalizePositive(s.angle()), s.getLength()]
}

export const angle = (p0, p1) => Angle.angle(p0, p1)

const appendHead = ([head, ...tail]) => [head, ...tail, head]
export const circle = ({ x, y }, radius, n) => appendHead(R.range(0, n))
  .map(i => (2 * Math.PI / n) * i)
  .map(α => [x + radius * Math.cos(α), y + radius * Math.sin(α)])
  .map(coordinate)

export const arc = ({ x, y }, radius, α1, α2, n) => R.range(0, n)
  .map(i => α1 - α2 / n * i)
  .map(α => [x + radius * Math.cos(α), y + radius * Math.sin(α)])
  .map(coordinate)
