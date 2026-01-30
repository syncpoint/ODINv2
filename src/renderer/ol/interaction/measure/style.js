import { Polygon } from './PolygonStyle'
import { LineString } from './LineStringStyle'
import { Point } from './PointStyle'
import { baseStyle } from './baseStyle'

/**
 * @typedef {import('ol/Feature').default} Feature
 * @typedef {import('ol/geom/Geometry').default} Geometry
 * @typedef {import('ol/style/Style').default} Style
 */

/**
 * @typedef {Object} StyleFunctions
 * @property {function(import('ol/geom/Polygon').default): Style[]} Polygon - Style function for Polygon geometries
 * @property {function(import('ol/geom/LineString').default): Style[]} LineString - Style function for LineString geometries
 */

/**
 * Map of geometry types to their corresponding style functions.
 * @type {StyleFunctions}
 */
export const STYLES = {
  Polygon,
  LineString,
  Point
}

/**
 * Creates a style function for measurement features.
 * Combines base styles with geometry-specific styles based on the feature's geometry type.
 * @param {function(Feature): boolean} isSelected - Function that determines if a feature is selected
 * @returns {function(Feature): Style[]} Style function that returns an array of styles for a feature
 */
export const styleFN = (isSelected) => {
  return feature => {
    const geometry = feature.getGeometry()
    const geometryType = geometry.getType()
    const styleFn = STYLES[geometryType]

    // No style function for this geometry type (e.g., Circle during drawing)
    if (!styleFn) {
      return baseStyle(isSelected(feature))
    }

    const selected = isSelected(feature)

    // Point style needs feature and selected state for radius property access
    const geometryStyles = geometryType === 'Point'
      ? styleFn(geometry, feature, selected)
      : styleFn(geometry)

    // Skip base style for Point with radius (circle measure) as it has its own styling
    if (geometryType === 'Point' && feature.get('radius')) {
      return geometryStyles
    }

    return [
      ...baseStyle(selected),
      ...geometryStyles
    ]
  }
}
