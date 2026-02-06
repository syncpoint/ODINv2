/**
 * MessageHandler - Handles incoming WebSocket commands and queries
 *
 * Processes commands (put/del/batch) and queries (prefix-based data retrieval)
 * from external WebSocket servers.
 */

import {
  MESSAGE_TYPES,
  ACTIONS,
  VIEW_ACTIONS,
  ERROR_CODES,
  isValidKey,
  isFeatureKey,
  isTagsKey,
  hasValidGeometry,
  deduplicateTags
} from './protocol'
import {
  transformIncoming,
  transformOperationIncoming,
  transformTupleOutgoing,
  coordToInternal,
  coordToGeoJSON
} from './coordinates'

/**
 * Create a message handler for processing incoming WebSocket messages.
 *
 * @param {Object} options
 * @param {Object} options.store - The ODIN store instance
 * @param {string} options.clientId - Unique client ID to mark operations (prevents echo)
 * @param {Function} options.send - Function to send responses back via WebSocket
 * @param {Object} options.emitter - Event emitter for map control
 * @param {Object} options.sessionStore - Session store for view state
 * @returns {Object} - Handler object with methods for processing messages
 */
export const createMessageHandler = ({ store, clientId, send, emitter, sessionStore }) => {

  /**
   * Send a success response for a command.
   */
  const sendCommandSuccess = (id) => {
    send({
      type: MESSAGE_TYPES.COMMAND_RESPONSE,
      id,
      success: true
    })
  }

  /**
   * Send a query response with data.
   */
  const sendQueryResponse = (id, tuples) => {
    send({
      type: MESSAGE_TYPES.QUERY_RESPONSE,
      id,
      success: true,
      payload: { tuples }
    })
  }

  /**
   * Send an error response.
   */
  const sendError = (id, code, message) => {
    send({
      type: MESSAGE_TYPES.ERROR,
      id,
      error: { code, message }
    })
  }

  /**
   * Validate operations array for batch commands.
   */
  const validateOperations = (operations) => {
    if (!Array.isArray(operations)) {
      return { valid: false, error: 'Operations must be an array' }
    }

    for (const op of operations) {
      if (!op.type || !op.key) {
        return { valid: false, error: 'Each operation must have type and key' }
      }
      if (op.type !== 'put' && op.type !== 'del') {
        return { valid: false, error: `Invalid operation type: ${op.type}` }
      }
      if (!isValidKey(op.key)) {
        return { valid: false, error: `Invalid key: ${op.key}` }
      }
      if (op.type === 'put' && op.value === undefined) {
        return { valid: false, error: 'Put operations must have a value' }
      }
      // Validate geometry for feature keys
      if (op.type === 'put' && isFeatureKey(op.key) && !hasValidGeometry(op.value)) {
        return { valid: false, error: `Feature ${op.key} must have valid geometry with type` }
      }
    }

    return { valid: true }
  }

  /**
   * Execute a put command.
   */
  const executePut = async (msg) => {
    const { key, value } = msg.payload

    if (!isValidKey(key)) {
      return sendError(msg.id, ERROR_CODES.INVALID_KEY, `Invalid key: ${key}`)
    }

    if (value === undefined) {
      return sendError(msg.id, ERROR_CODES.COMMAND_FAILED, 'Value is required for put')
    }

    // Validate geometry for feature keys
    if (isFeatureKey(key) && !hasValidGeometry(value)) {
      return sendError(msg.id, ERROR_CODES.COMMAND_FAILED, 'Feature must have valid geometry with type')
    }

    // Transform value based on key type
    let transformedValue = value
    if (isFeatureKey(key)) {
      // Transform coordinates from GeoJSON (EPSG:4326) to internal (EPSG:3857)
      transformedValue = transformIncoming(value)
    } else if (isTagsKey(key)) {
      // Deduplicate tags case-insensitively
      transformedValue = deduplicateTags(value)
    }

    try {
      await store.import([{ type: 'put', key, value: transformedValue }], { creatorId: clientId })
      sendCommandSuccess(msg.id)
    } catch (error) {
      sendError(msg.id, ERROR_CODES.COMMAND_FAILED, error.message)
    }
  }

  /**
   * Execute a delete command.
   */
  const executeDel = async (msg) => {
    const { key } = msg.payload

    if (!isValidKey(key)) {
      return sendError(msg.id, ERROR_CODES.INVALID_KEY, `Invalid key: ${key}`)
    }

    try {
      await store.import([{ type: 'del', key }], { creatorId: clientId })
      sendCommandSuccess(msg.id)
    } catch (error) {
      sendError(msg.id, ERROR_CODES.COMMAND_FAILED, error.message)
    }
  }

  /**
   * Execute a batch command.
   */
  const executeBatch = async (msg) => {
    const { operations } = msg.payload

    const validation = validateOperations(operations)
    if (!validation.valid) {
      return sendError(msg.id, ERROR_CODES.INVALID_ACTION, validation.error)
    }

    // Transform operations based on key type
    const transformedOperations = operations.map(op => {
      if (op.type !== 'put') return op
      if (isFeatureKey(op.key)) {
        // Transform coordinates from GeoJSON (EPSG:4326) to internal (EPSG:3857)
        return transformOperationIncoming(op)
      } else if (isTagsKey(op.key)) {
        // Deduplicate tags case-insensitively
        return { ...op, value: deduplicateTags(op.value) }
      }
      return op
    })

    try {
      await store.import(transformedOperations, { creatorId: clientId })
      sendCommandSuccess(msg.id)
    } catch (error) {
      sendError(msg.id, ERROR_CODES.COMMAND_FAILED, error.message)
    }
  }

  /**
   * Handle an incoming command message.
   */
  const handleCommand = async (msg) => {
    if (!msg.id) {
      console.warn('[WebSocketAPI] Command missing id:', msg)
      return
    }

    if (!msg.payload || !msg.payload.action) {
      return sendError(msg.id, ERROR_CODES.INVALID_ACTION, 'Missing action in payload')
    }

    const { action } = msg.payload

    switch (action) {
      case ACTIONS.PUT:
        return executePut(msg)
      case ACTIONS.DEL:
        return executeDel(msg)
      case ACTIONS.BATCH:
        return executeBatch(msg)
      default:
        sendError(msg.id, ERROR_CODES.INVALID_ACTION, `Unknown action: ${action}`)
    }
  }

  /**
   * Handle an incoming query message.
   */
  const handleQuery = async (msg) => {
    if (!msg.id) {
      console.warn('[WebSocketAPI] Query missing id:', msg)
      return
    }

    if (!msg.payload || !msg.payload.prefix) {
      return sendError(msg.id, ERROR_CODES.QUERY_FAILED, 'Missing prefix in payload')
    }

    const { prefix } = msg.payload

    try {
      const tuples = await store.tuples(prefix)
      // Transform coordinates from internal (EPSG:3857) to GeoJSON (EPSG:4326)
      const transformedTuples = tuples.map(transformTupleOutgoing)
      sendQueryResponse(msg.id, transformedTuples)
    } catch (error) {
      sendError(msg.id, ERROR_CODES.QUERY_FAILED, error.message)
    }
  }

  /**
   * Send a view response with current view state.
   */
  const sendViewResponse = (id, viewState) => {
    send({
      type: MESSAGE_TYPES.VIEW_RESPONSE,
      id,
      success: true,
      payload: viewState
    })
  }

  /**
   * Handle an incoming view message.
   */
  const handleView = async (msg) => {
    if (!msg.id) {
      console.warn('[WebSocketAPI] View message missing id:', msg)
      return
    }

    if (!msg.payload || !msg.payload.action) {
      return sendError(msg.id, ERROR_CODES.INVALID_ACTION, 'Missing action in payload')
    }

    const { action } = msg.payload

    switch (action) {
      case VIEW_ACTIONS.FLYTO: {
        const { center, zoom } = msg.payload
        if (!center || !Array.isArray(center) || center.length !== 2) {
          return sendError(msg.id, ERROR_CODES.INVALID_ACTION, 'flyto requires center as [lon, lat]')
        }
        // Transform from GeoJSON (EPSG:4326) to internal (EPSG:3857)
        const internalCenter = coordToInternal(center)
        // Emit map event - view.js handles the animation
        emitter.emit('map/flyto', { center: internalCenter, zoom })
        sendCommandSuccess(msg.id)
        break
      }
      case VIEW_ACTIONS.GET: {
        try {
          const viewport = await sessionStore.get('viewport', {})
          // Transform center from internal (EPSG:3857) to GeoJSON (EPSG:4326)
          const center = viewport.center ? coordToGeoJSON(viewport.center) : null
          sendViewResponse(msg.id, {
            center,
            zoom: viewport.zoom,
            resolution: viewport.resolution,
            rotation: viewport.rotation
          })
        } catch (error) {
          sendError(msg.id, ERROR_CODES.QUERY_FAILED, error.message)
        }
        break
      }
      default:
        sendError(msg.id, ERROR_CODES.INVALID_ACTION, `Unknown view action: ${action}`)
    }
  }

  return {
    handleCommand,
    handleQuery,
    handleView
  }
}
