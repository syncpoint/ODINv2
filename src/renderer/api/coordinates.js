/**
 * Coordinate transformation utilities for WebSocket API
 *
 * Transforms between internal format (EPSG:3857 Web Mercator)
 * and GeoJSON standard format (EPSG:4326 WGS84 lon/lat).
 */

import { reproject } from 'reproject'

const INTERNAL_PROJECTION = 'EPSG:3857'
const GEOJSON_PROJECTION = 'EPSG:4326'

/**
 * Transform a geometry from internal format to GeoJSON format.
 * @param {Object} geometry - GeoJSON geometry in EPSG:3857
 * @returns {Object} - GeoJSON geometry in EPSG:4326
 */
export const toGeoJSON = geometry => {
  if (!geometry || !geometry.type) return geometry
  return reproject(geometry, INTERNAL_PROJECTION, GEOJSON_PROJECTION)
}

/**
 * Transform a geometry from GeoJSON format to internal format.
 * @param {Object} geometry - GeoJSON geometry in EPSG:4326
 * @returns {Object} - GeoJSON geometry in EPSG:3857
 */
export const fromGeoJSON = geometry => {
  if (!geometry || !geometry.type) return geometry
  return reproject(geometry, GEOJSON_PROJECTION, INTERNAL_PROJECTION)
}

/**
 * Transform a feature value for outgoing messages (to external clients).
 * @param {Object} value - Feature value with geometry in EPSG:3857
 * @returns {Object} - Feature value with geometry in EPSG:4326
 */
export const transformOutgoing = value => {
  if (!value || !value.geometry) return value
  return {
    ...value,
    geometry: toGeoJSON(value.geometry)
  }
}

/**
 * Transform a feature value for incoming messages (from external clients).
 * @param {Object} value - Feature value with geometry in EPSG:4326
 * @returns {Object} - Feature value with geometry in EPSG:3857
 */
export const transformIncoming = value => {
  if (!value || !value.geometry) return value
  return {
    ...value,
    geometry: fromGeoJSON(value.geometry)
  }
}

/**
 * Transform an operation for outgoing messages.
 * Only transforms put operations with geometry.
 * @param {Object} operation - Store operation
 * @returns {Object} - Transformed operation
 */
export const transformOperationOutgoing = operation => {
  if (operation.type !== 'put') return operation
  if (!operation.value?.geometry) return operation
  return {
    ...operation,
    value: transformOutgoing(operation.value)
  }
}

/**
 * Transform an operation for incoming messages.
 * Only transforms put operations with geometry.
 * @param {Object} operation - Store operation
 * @returns {Object} - Transformed operation
 */
export const transformOperationIncoming = operation => {
  if (operation.type !== 'put') return operation
  if (!operation.value?.geometry) return operation
  return {
    ...operation,
    value: transformIncoming(operation.value)
  }
}

/**
 * Transform a tuple [key, value] for outgoing query responses.
 * @param {Array} tuple - [key, value] tuple
 * @returns {Array} - Transformed tuple
 */
export const transformTupleOutgoing = ([key, value]) => {
  if (!value?.geometry) return [key, value]
  return [key, transformOutgoing(value)]
}
