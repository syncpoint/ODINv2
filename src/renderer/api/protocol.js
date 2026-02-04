/**
 * WebSocket API Protocol Constants
 *
 * Defines message types for communication between ODIN and external WebSocket servers.
 */

// Outgoing message types (ODIN -> External Server)
export const MESSAGE_TYPES = {
  CONNECTED: 'connected',
  BATCH: 'batch',
  COMMAND_RESPONSE: 'command:response',
  QUERY_RESPONSE: 'query:response',
  VIEW_RESPONSE: 'view:response',
  ERROR: 'error'
}

// Incoming message types (External Server -> ODIN)
export const INCOMING_TYPES = {
  COMMAND: 'command',
  QUERY: 'query',
  VIEW: 'view'
}

// View action types
export const VIEW_ACTIONS = {
  FLYTO: 'flyto',
  GET: 'get'
}

// Command action types
export const ACTIONS = {
  PUT: 'put',
  DEL: 'del',
  BATCH: 'batch'
}

// Error codes
export const ERROR_CODES = {
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  INVALID_KEY: 'INVALID_KEY',
  INVALID_ACTION: 'INVALID_ACTION',
  COMMAND_FAILED: 'COMMAND_FAILED',
  QUERY_FAILED: 'QUERY_FAILED'
}

// Valid key prefixes that can be written via the API
export const VALID_KEY_PREFIXES = [
  'layer:',
  'feature:',
  'marker:',
  'bookmark:',
  'place:',
  'link+',
  'tags+',
  'hidden+',
  'locked+',
  'style+'
]

/**
 * Validate that a key starts with a valid prefix.
 * @param {string} key - The key to validate
 * @returns {boolean} - True if key is valid
 */
export const isValidKey = key => {
  if (typeof key !== 'string' || key.length === 0) return false
  return VALID_KEY_PREFIXES.some(prefix => key.startsWith(prefix))
}

// Key prefixes that require geometry validation
const GEOMETRY_REQUIRED_PREFIXES = ['feature:', 'marker:']

/**
 * Check if a key represents a feature that requires geometry.
 * @param {string} key - The key to check
 * @returns {boolean} - True if key requires geometry validation
 */
export const isFeatureKey = key => {
  if (typeof key !== 'string') return false
  return GEOMETRY_REQUIRED_PREFIXES.some(prefix => key.startsWith(prefix))
}

/**
 * Validate that a feature value has valid geometry.
 * @param {Object} value - The feature value to validate
 * @returns {boolean} - True if geometry is valid
 */
export const hasValidGeometry = value => {
  return value?.geometry?.type !== undefined
}

/**
 * Check if a key represents a tags entry.
 * @param {string} key - The key to check
 * @returns {boolean} - True if key is a tags key
 */
export const isTagsKey = key => {
  if (typeof key !== 'string') return false
  return key.startsWith('tags+')
}

/**
 * Deduplicate tags array case-insensitively (first occurrence wins).
 * @param {Array} tags - Array of tag strings
 * @returns {Array} - Deduplicated array
 */
export const deduplicateTags = tags => {
  if (!Array.isArray(tags)) return tags
  const seen = new Set()
  return tags.filter(tag => {
    const upper = tag.toUpperCase()
    if (seen.has(upper)) return false
    seen.add(upper)
    return true
  })
}
