import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory.js'
import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser.js'
import * as geom from 'ol/geom.js'

const K = v => fn => { fn(v); return v }
const geometryFactory = new GeometryFactory()

/**
 * Setup JST/OL parser to convert between JST and OL geometries.
 * REFERENCE: http://bjornharrtell.github.io/jsts/1.6.1/doc/module-org_locationtech_jts_io_OL3Parser.html
 */
const parser = K(new OL3Parser(geometryFactory))(parser => parser.inject(
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
export const write = jtsGeometry => parser.write(jtsGeometry)
