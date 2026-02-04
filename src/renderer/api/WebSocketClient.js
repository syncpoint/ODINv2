/**
 * WebSocketClient - Per-project WebSocket client for external integrations
 *
 * Connects ODIN to an external WebSocket server, enabling:
 * - Real-time streaming of data changes (batch events)
 * - Receiving and executing CRUD commands from external tools
 * - Query-based data retrieval
 */

import uuid from '../../shared/uuid'
import Emitter from '../../shared/emitter'
import { MESSAGE_TYPES, INCOMING_TYPES } from './protocol'
import { createMessageHandler } from './MessageHandler'
import { transformOperationOutgoing } from './coordinates'

// Reconnection settings
const INITIAL_RECONNECT_DELAY = 1000 // 1 second
const MAX_RECONNECT_DELAY = 30000 // 30 seconds
const RECONNECT_MULTIPLIER = 2

// WebSocket ready states
const READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}

/**
 * Create a WebSocket client for external integrations.
 *
 * @param {Object} options
 * @param {Object} options.store - The ODIN store instance
 * @param {Object} options.emitter - Event emitter for map control
 * @param {Object} options.sessionStore - Session store for view state
 * @param {string} options.projectId - Project UUID
 * @param {string} options.projectName - Project display name
 * @param {string} options.odinVersion - ODIN version string
 * @returns {Object} - WebSocket client instance
 */
export function WebSocketClient ({ store, emitter, sessionStore, projectId, projectName, odinVersion }) {
  Emitter.call(this)

  this.store = store
  this.emitter = emitter
  this.sessionStore = sessionStore
  this.projectId = projectId
  this.projectName = projectName
  this.odinVersion = odinVersion
  this.clientId = uuid()
  this.ws = null
  this.url = null
  this.reconnectDelay = INITIAL_RECONNECT_DELAY
  this.reconnectTimeout = null
  this.intentionalClose = false
  this.messageHandler = null
  this.batchHandler = null
}

// Inherit from Emitter
Object.setPrototypeOf(WebSocketClient.prototype, Emitter.prototype)

/**
 * Connect to a WebSocket server.
 *
 * @param {string} url - WebSocket URL (e.g., ws://localhost:9000)
 */
WebSocketClient.prototype.connect = function (url) {
  // Guard against connecting while already connected or connecting
  if (this.ws) {
    if (this.ws.readyState === READY_STATE.OPEN) {
      console.warn('[WebSocketAPI] Already connected, disconnect first')
      return
    }
    if (this.ws.readyState === READY_STATE.CONNECTING) {
      console.warn('[WebSocketAPI] Connection already in progress')
      return
    }
  }

  this.url = url
  this.intentionalClose = false
  this.reconnectDelay = INITIAL_RECONNECT_DELAY

  this._createConnection()
}

/**
 * Disconnect from the WebSocket server.
 */
WebSocketClient.prototype.disconnect = function () {
  this.intentionalClose = true

  if (this.reconnectTimeout) {
    clearTimeout(this.reconnectTimeout)
    this.reconnectTimeout = null
  }

  if (this.ws) {
    this.ws.close()
    this.ws = null
  }

  this._unsubscribeFromStore()
  this.emit('status', { connected: false, url: this.url })
}

/**
 * Check if currently connected.
 *
 * @returns {boolean}
 */
WebSocketClient.prototype.isConnected = function () {
  return this.ws && this.ws.readyState === READY_STATE.OPEN
}

/**
 * Get current connection status.
 *
 * @returns {Object}
 */
WebSocketClient.prototype.getStatus = function () {
  return {
    connected: this.isConnected(),
    url: this.url,
    clientId: this.clientId
  }
}

/**
 * Send a message to the WebSocket server.
 *
 * @param {Object} message - Message object to send
 */
WebSocketClient.prototype.send = function (message) {
  if (!this.isConnected()) {
    console.warn('[WebSocketAPI] Cannot send, not connected')
    return false
  }

  try {
    this.ws.send(JSON.stringify(message))
    return true
  } catch (error) {
    console.error('[WebSocketAPI] Send error:', error)
    return false
  }
}

/**
 * Create the WebSocket connection.
 * @private
 */
WebSocketClient.prototype._createConnection = function () {
  // Clean up any existing connection first
  if (this.ws) {
    // Remove listeners to prevent callbacks on old socket
    this.ws.onopen = null
    this.ws.onmessage = null
    this.ws.onclose = null
    this.ws.onerror = null
    // Close if not already closed
    if (this.ws.readyState === READY_STATE.OPEN ||
        this.ws.readyState === READY_STATE.CONNECTING) {
      this.ws.close()
    }
    this.ws = null
  }

  try {
    this.ws = new WebSocket(this.url)
  } catch (error) {
    console.error('[WebSocketAPI] Connection error:', error)
    this._scheduleReconnect()
    return
  }

  this.ws.onopen = () => {
    console.log('[WebSocketAPI] Connected to', this.url)
    this.reconnectDelay = INITIAL_RECONNECT_DELAY
    this._sendConnected()
    this._subscribeToStore()
    this.emit('status', { connected: true, url: this.url })
  }

  this.ws.onmessage = (event) => {
    this._handleMessage(event)
  }

  this.ws.onclose = (event) => {
    console.log('[WebSocketAPI] Connection closed:', event.code, event.reason)
    this._unsubscribeFromStore()
    this.emit('status', { connected: false, url: this.url })

    if (!this.intentionalClose) {
      this._scheduleReconnect()
    }
  }

  this.ws.onerror = (error) => {
    console.error('[WebSocketAPI] WebSocket error:', error)
  }
}

/**
 * Send the connected message with project info.
 * @private
 */
WebSocketClient.prototype._sendConnected = function () {
  this.send({
    type: MESSAGE_TYPES.CONNECTED,
    payload: {
      projectId: this.projectId,
      projectName: this.projectName,
      odinVersion: this.odinVersion,
      clientId: this.clientId
    }
  })
}

/**
 * Subscribe to store batch events to forward changes.
 * @private
 */
WebSocketClient.prototype._subscribeToStore = function () {
  // Always unsubscribe first to prevent duplicate subscriptions
  this._unsubscribeFromStore()

  // Create message handler for incoming commands
  this.messageHandler = createMessageHandler({
    store: this.store,
    clientId: this.clientId,
    send: this.send.bind(this),
    emitter: this.emitter,
    sessionStore: this.sessionStore
  })

  // Create batch event handler with deduplication
  this.lastBatchKey = null
  this.batchHandler = ({ operations, creatorId }) => {
    // Don't echo back our own changes
    if (creatorId === this.clientId) return

    // Deduplicate: skip if this is the exact same batch as the last one
    // This handles cases where the same event might be delivered twice
    const batchKey = JSON.stringify(operations.map(op => ({ type: op.type, key: op.key })))
    if (batchKey === this.lastBatchKey) {
      console.log('[WebSocketAPI] Skipping duplicate batch')
      return
    }
    this.lastBatchKey = batchKey

    // Clear the dedup key after a short delay to allow legitimate repeated operations
    clearTimeout(this.batchDedupeTimeout)
    this.batchDedupeTimeout = setTimeout(() => {
      this.lastBatchKey = null
    }, 100)

    // Transform coordinates from internal (EPSG:3857) to GeoJSON (EPSG:4326)
    const transformedOperations = operations.map(transformOperationOutgoing)

    this.send({
      type: MESSAGE_TYPES.BATCH,
      payload: {
        operations: transformedOperations,
        timestamp: Date.now()
      }
    })
  }

  this.store.on('batch', this.batchHandler)
}

/**
 * Unsubscribe from store events.
 * @private
 */
WebSocketClient.prototype._unsubscribeFromStore = function () {
  if (this.batchHandler) {
    this.store.off('batch', this.batchHandler)
    this.batchHandler = null
  }
  if (this.batchDedupeTimeout) {
    clearTimeout(this.batchDedupeTimeout)
    this.batchDedupeTimeout = null
  }
  this.lastBatchKey = null
  this.messageHandler = null
}

/**
 * Handle incoming WebSocket message.
 * @private
 */
WebSocketClient.prototype._handleMessage = function (event) {
  let msg
  try {
    msg = JSON.parse(event.data)
  } catch (error) {
    console.error('[WebSocketAPI] Invalid JSON:', error)
    return
  }

  if (!msg.type) {
    console.warn('[WebSocketAPI] Message missing type:', msg)
    return
  }

  switch (msg.type) {
    case INCOMING_TYPES.COMMAND:
      if (this.messageHandler) {
        this.messageHandler.handleCommand(msg)
      }
      break
    case INCOMING_TYPES.QUERY:
      if (this.messageHandler) {
        this.messageHandler.handleQuery(msg)
      }
      break
    case INCOMING_TYPES.VIEW:
      if (this.messageHandler) {
        this.messageHandler.handleView(msg)
      }
      break
    default:
      console.warn('[WebSocketAPI] Unknown message type:', msg.type)
  }
}

/**
 * Schedule a reconnection attempt with exponential backoff.
 * @private
 */
WebSocketClient.prototype._scheduleReconnect = function () {
  if (this.intentionalClose) return

  console.log(`[WebSocketAPI] Reconnecting in ${this.reconnectDelay}ms...`)

  this.reconnectTimeout = setTimeout(() => {
    this.reconnectTimeout = null
    this._createConnection()
  }, this.reconnectDelay)

  // Exponential backoff
  this.reconnectDelay = Math.min(
    this.reconnectDelay * RECONNECT_MULTIPLIER,
    MAX_RECONNECT_DELAY
  )
}
