import * as R from 'ramda'
import * as ID from '../../ids'

/**
 * @typedef {Object} MeasurementDocument
 * @property {string} id - Unique identifier for the measurement
 * @property {string} scope - Scope identifier (MEASURE)
 * @property {string} text - Display text (measurement name)
 * @property {string[]} tags - Array of associated tags
 */

/**
 * Document handler for measurement entities.
 * Retrieves basic measurement data for document listing.
 * @this {Object} Context with store property
 * @param {string} id - Measurement identifier
 * @returns {Promise<MeasurementDocument>} Formatted measurement document
 */
export default async function (id) {
  const keys = [R.identity, ID.tagsId]
  const [measurement, tags] = await this.store.collect(id, keys)

  return {
    id,
    scope: ID.MEASURE,
    text: measurement?.name || '',
    tags: tags || []
  }
}
