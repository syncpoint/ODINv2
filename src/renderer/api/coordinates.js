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
 * Transform a coordinate [lon, lat] from GeoJSON to internal format.
 * @param {Array} coord - [lon, lat] in EPSG:4326
 * @returns {Array} - [x, y] in EPSG:3857
 */
export const coordToInternal = coord => {
  if (!coord || !Array.isArray(coord)) return coord
  const point = { type: 'Point', coordinates: coord }
  const transformed = reproject(point, GEOJSON_PROJECTION, INTERNAL_PROJECTION)
  return transformed.coordinates
}

/**
 * Transform a coordinate [x, y] from internal to GeoJSON format.
 * @param {Array} coord - [x, y] in EPSG:3857
 * @returns {Array} - [lon, lat] in EPSG:4326
 */
export const coordToGeoJSON = coord => {
  if (!coord || !Array.isArray(coord)) return coord
  const point = { type: 'Point', coordinates: coord }
  const transformed = reproject(point, INTERNAL_PROJECTION, GEOJSON_PROJECTION)
  return transformed.coordinates
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
 * Handles both features (with geometry) and bookmarks (with center).
 * @param {Object} value - Value with geometry/center in EPSG:3857
 * @returns {Object} - Value with geometry/center in EPSG:4326
 */
export const transformOutgoing = value => {
  if (!value) return value

  let result = value

  // Transform geometry (features, markers)
  if (value.geometry) {
    result = { ...result, geometry: toGeoJSON(value.geometry) }
  }

  // Transform center (bookmarks)
  if (value.center && Array.isArray(value.center)) {
    result = { ...result, center: coordToGeoJSON(value.center) }
  }

  return result
}

/**
 * Transform a feature value for incoming messages (from external clients).
 * Handles both features (with geometry) and bookmarks (with center).
 * @param {Object} value - Value with geometry/center in EPSG:4326
 * @returns {Object} - Value with geometry/center in EPSG:3857
 */
export const transformIncoming = value => {
  if (!value) return value

  let result = value

  // Transform geometry (features, markers)
  if (value.geometry) {
    result = { ...result, geometry: fromGeoJSON(value.geometry) }
  }

  // Transform center (bookmarks)
  if (value.center && Array.isArray(value.center)) {
    result = { ...result, center: coordToInternal(value.center) }
  }

  return result
}

/**
 * Check if a value needs coordinate transformation.
 * @param {Object} value - Value to check
 * @returns {boolean} - True if value has coordinates to transform
 */
const needsTransformation = value => {
  if (!value) return false
  return value.geometry || (value.center && Array.isArray(value.center))
}

/**
 * Transform an operation for outgoing messages.
 * Transforms put operations with geometry or center coordinates.
 * @param {Object} operation - Store operation
 * @returns {Object} - Transformed operation
 */
export const transformOperationOutgoing = operation => {
  if (operation.type !== 'put') return operation
  if (!needsTransformation(operation.value)) return operation
  return {
    ...operation,
    value: transformOutgoing(operation.value)
  }
}

/**
 * Transform an operation for incoming messages.
 * Transforms put operations with geometry or center coordinates.
 * @param {Object} operation - Store operation
 * @returns {Object} - Transformed operation
 */
export const transformOperationIncoming = operation => {
  if (operation.type !== 'put') return operation
  if (!needsTransformation(operation.value)) return operation
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
  if (!needsTransformation(value)) return [key, value]
  return [key, transformOutgoing(value)]
}
