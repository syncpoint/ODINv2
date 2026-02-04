/**
 * MessageHandler - Handles incoming WebSocket commands and queries
 *
 * Processes commands (put/del/batch) and queries (prefix-based data retrieval)
 * from external WebSocket servers.
 */

import {
  MESSAGE_TYPES,
  ACTIONS,
  ERROR_CODES,
  isValidKey,
  isFeatureKey,
  hasValidGeometry
} from './protocol'
import {
  transformIncoming,
  transformOperationIncoming,
  transformTupleOutgoing
} from './coordinates'

/**
 * Create a message handler for processing incoming WebSocket messages.
 *
 * @param {Object} store - The ODIN store instance
 * @param {string} clientId - Unique client ID to mark operations (prevents echo)
 * @param {Function} send - Function to send responses back via WebSocket
 * @returns {Object} - Handler object with methods for processing messages
 */
export const createMessageHandler = (store, clientId, send) => {

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

    // Transform coordinates from GeoJSON (EPSG:4326) to internal (EPSG:3857)
    const transformedValue = isFeatureKey(key) ? transformIncoming(value) : value

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

    // Transform coordinates from GeoJSON (EPSG:4326) to internal (EPSG:3857)
    const transformedOperations = operations.map(op =>
      isFeatureKey(op.key) ? transformOperationIncoming(op) : op
    )

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

  return {
    handleCommand,
    handleQuery
  }
}
