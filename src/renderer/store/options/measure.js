import * as R from 'ramda'
import { area, length } from '../../ol/interaction/measure/tools'
import * as ID from '../../ids'
import LineString from 'ol/geom/LineString'
import Polygon from 'ol/geom/Polygon'

/**
 * @typedef {Object} GeoJSONGeometry
 * @property {string} type - Geometry type (e.g., 'LineString', 'Polygon')
 * @property {Array} coordinates - Coordinate array
 */

/**
 * @typedef {Object} MeasurementOptions
 * @property {string} id - Unique identifier for the measurement
 * @property {string} title - Display title (measurement name)
 * @property {string|undefined} description - Description showing measurement values
 * @property {string} tags - Space-separated tag string for display
 * @property {string} capabilities - Pipe-separated capability flags (TAG|RENAME)
 */

/**
 * Generates a description string for a measurement geometry.
 * @param {GeoJSONGeometry} geometry - GeoJSON geometry object
 * @returns {string} Description with measurement values, or empty string if type not supported
 */
const getDescription = geometry => {
  switch (geometry.type) {
    case 'LineString': return `Distance ${length(new LineString(geometry.coordinates))}`
    case 'Polygon': { const polygon = new Polygon(geometry.coordinates); return `Area ${area(polygon)} - Circumfence ${length(polygon)}` }
    default: return ''
  }
}

/**
 * Options handler for measurement entities.
 * Retrieves and formats measurement data for display in the sidebar.
 * @this {Object} Context with store property
 * @param {string} id - Measurement identifier
 * @returns {Promise<MeasurementOptions>} Formatted measurement options
 */
export default async function (id) {
  const keys = [R.identity, ID.hiddenId, ID.lockedId, ID.tagsId]
  const [measurement, hidden, locked, tags] = await this.store.collect(id, keys)

  const geometries = await this.store.geometries(id)
  const description = geometries.length === 1
    ? getDescription(geometries[0])
    : undefined


  return {
    id,
    title: measurement.name,
    description,
    tags: [
      'SCOPE:MEASURE:NONE',
      hidden ? 'SYSTEM:HIDDEN::mdiEyeOff' : 'SYSTEM:VISIBLE::mdiEyeOutline',
      locked ? 'SYSTEM:LOCKED::mdiLock' : 'SYSTEM:UNLOCKED::mdiLockOpenVariantOutline',
      ...((tags || [])).map(label => `USER:${label}:NONE`),
      'PLUS'
    ].join(' '),
    capabilities: 'TAG|RENAME'
  }
}
