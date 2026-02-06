/**
 * @typedef {Object} GeometryTypeEnum
 * @property {string} POINT - Point geometry type
 * @property {string} LINE_STRING - LineString geometry type
 * @property {string} LINEAR_RING - LinearRing geometry type
 * @property {string} POLYGON - Polygon geometry type
 * @property {string} MULTI_POINT - MultiPoint geometry type
 * @property {string} MULTI_LINE_STRING - MultiLineString geometry type
 * @property {string} MULTI_POLYGON - MultiPolygon geometry type
 * @property {string} GEOMETRY_COLLECTION - GeometryCollection geometry type
 * @property {string} CIRCLE - Circle geometry type
 */

/**
 * Enumeration of OpenLayers geometry type strings.
 * @type {GeometryTypeEnum}
 */
const GeometryType = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection',
  CIRCLE: 'Circle'
}

export default GeometryType
