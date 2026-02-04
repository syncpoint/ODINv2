/**
 * WebSocket API for External Integrations
 *
 * This module provides a WebSocket client that enables external tools
 * to receive real-time data changes and send CRUD commands to ODIN projects.
 *
 * Usage:
 *   import { WebSocketClient } from './api'
 *
 *   const wsClient = new WebSocketClient({
 *     store,
 *     projectId: 'uuid-xxxx',
 *     projectName: 'My Project',
 *     odinVersion: '3.1.0'
 *   })
 *
 *   wsClient.connect('ws://localhost:9000')
 *
 *   // Listen for connection status changes
 *   wsClient.on('status', ({ connected, url }) => {
 *     console.log('Connection status:', connected ? 'connected' : 'disconnected')
 *   })
 *
 *   // Disconnect when done
 *   wsClient.disconnect()
 */

export { WebSocketClient } from './WebSocketClient'
export * from './protocol'
