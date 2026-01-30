import GeometryType from '../GeometryType'
import { getArea, getLength } from 'ol/sphere'

/**
 * @typedef {import('ol/geom/LineString').default} LineString
 * @typedef {import('ol/geom/Polygon').default} Polygon
 * @typedef {import('ol/geom/Geometry').default} Geometry
 * @typedef {import('ol/coordinate').Coordinate} Coordinate
 */

/** @type {Intl.NumberFormat} */
const meterFormatter = new Intl.NumberFormat(window.navigator.userLanguage || window.navigator.language, { maximumFractionDigits: 1, style: 'unit', unit: 'meter' })

/** @type {Intl.NumberFormat} */
const kilometerFormatter = new Intl.NumberFormat(window.navigator.userLanguage || window.navigator.language, { maximumFractionDigits: 1, style: 'unit', unit: 'kilometer' })

/** @type {Intl.NumberFormat} */
const oneDigitFormatter = new Intl.NumberFormat(window.navigator.userLanguage || window.navigator.language, {
  maximumFractionDigits: 1
})

/**
 * Formats a length value in meters, converting to kilometers if >= 1000m.
 * @param {number} length - Length in meters
 * @returns {string} Formatted length with unit (e.g., "150 m" or "1.5 km")
 */
const formatLength = length => {
  if (length < 1000) {
    return meterFormatter.format(length)
  }
  return kilometerFormatter.format(length / 1000)
}

/**
 * Formats an angle value in degrees with a degree symbol.
 * @param {number} angle - Angle in degrees
 * @returns {string} Formatted angle (e.g., "45.5°")
 */
export const formatAngle = angle => {
  return `${oneDigitFormatter.format(angle)}°`
}

/**
 * Formats an area value in square meters or square kilometers.
 * @param {number} area - Area in square meters
 * @returns {string} Formatted area with unit (e.g., "500 m²" or "1.5 km²")
 */
export const formatArea = area => {
  const unit = area > 100000 ? 'km²' : 'm²'
  const factor = area > 100000 ? 1000000 : 1
  return `${oneDigitFormatter.format(area / factor)} ${unit}`
}

/**
 * Calculates and formats the geodesic length of a geometry.
 * @param {Geometry} geometry - The geometry to measure (LineString or Polygon)
 * @returns {string} Formatted length with unit
 */
export const length = geometry => {
  return formatLength(getLength(geometry))
}

/**
 * Calculates and formats the bearing angle of a line segment in degrees.
 * Returns the angle as a compass bearing (0° = North, 90° = East).
 * @param {LineString} lineStringSegment - A LineString with exactly two coordinates
 * @returns {string} Formatted angle with degree symbol (e.g., "45.5°")
 */
export const angle = lineStringSegment => {
  return formatAngle((-1 * radiansAngle(lineStringSegment) * 180 / Math.PI + 450) % 360)
}

/**
 * Calculates the angle of a line segment in radians.
 * @param {LineString} lineStringSegment - A LineString with exactly two coordinates
 * @returns {number} Angle in radians
 */
export const radiansAngle = lineStringSegment => {
  const start = lineStringSegment.getFirstCoordinate()
  const end = lineStringSegment.getLastCoordinate()
  return Math.atan2(end[1] - start[1], end[0] - start[0])
}

/**
 * Calculates and formats the geodesic area of a polygon.
 * @param {Polygon} polygonGeometry - The polygon geometry to measure
 * @returns {string} Formatted area with unit (e.g., "500 m²" or "1.5 km²")
 */
export const area = polygonGeometry => {
  return formatArea(getArea(polygonGeometry))
}

/**
 * Extracts the coordinates of the last segment of a LineString.
 * @param {LineString} lineStringGeometry - The LineString geometry
 * @returns {Coordinate[]} Array of two coordinates representing the last segment
 */
export const getLastSegmentCoordinates = lineStringGeometry => {
  const coordinates = lineStringGeometry.getCoordinates()
  if (coordinates.length <= 2) return coordinates
  return [coordinates[coordinates.length - 2], coordinates[coordinates.length - 1]]
}

/**
 * Checks if a geometry is a LineString with exactly one segment (two points).
 * @param {Geometry} lineStringGeometry - The geometry to check
 * @returns {boolean} True if the geometry is a single-segment LineString
 */
export const isSingleSegment = lineStringGeometry => {
  if (lineStringGeometry.getType() !== GeometryType.LINE_STRING) return false
  return lineStringGeometry.getCoordinates().length === 2
}
