#!/usr/bin/env node
/**
 * NIDO Test Server
 *
 * A simple WebSocket server for testing ODIN's NIDO integration.
 *
 * Usage:
 *   node tools/nido-test-server.js [port]
 *
 * Default port: 9000
 */

const WebSocket = require('ws')

const port = parseInt(process.argv[2]) || 9000
const wss = new WebSocket.Server({ port })

console.log(`\n🚀 NIDO Test Server running on ws://localhost:${port}\n`)
console.log('Waiting for ODIN to connect...\n')
console.log('Commands (type and press Enter):')
console.log('  query <prefix>     - Query data (e.g., "query layer:")')
console.log('  put <key> <json>   - Put a value (e.g., "put layer:test {"name":"Test"}")')
console.log('  del <key>          - Delete a key')
console.log('  flyto <lon> <lat>  - Fly to coordinates (e.g., "flyto 16.37 48.21")')
console.log('  getview            - Get current map view state')
console.log('  quit               - Exit server\n')

let clientSocket = null
let messageId = 1

wss.on('connection', (ws) => {
  clientSocket = ws
  console.log('✅ ODIN connected!\n')

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString())
      handleMessage(msg)
    } catch (e) {
      console.error('Invalid JSON received:', data.toString())
    }
  })

  ws.on('close', () => {
    console.log('\n❌ ODIN disconnected\n')
    clientSocket = null
  })

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message)
  })
})

function handleMessage(msg) {
  const timestamp = new Date().toISOString().substring(11, 19)

  switch (msg.type) {
    case 'connected':
      console.log(`[${timestamp}] 📡 CONNECTED`)
      console.log(`  Project: ${msg.payload.projectName} (${msg.payload.projectId})`)
      console.log(`  ODIN Version: ${msg.payload.odinVersion}`)
      console.log(`  Client ID: ${msg.payload.clientId}\n`)
      break

    case 'batch':
      console.log(`[${timestamp}] 📦 BATCH (${msg.payload.operations.length} operations)`)
      msg.payload.operations.forEach((op, i) => {
        if (op.type === 'put') {
          const preview = JSON.stringify(op.value).substring(0, 260)
          console.log(`  ${i + 1}. PUT ${op.key} = ${preview}${preview.length >= 260 ? '...' : ''}`)
        } else {
          console.log(`  ${i + 1}. DEL ${op.key}`)
        }
      })
      console.log()
      break

    case 'command:response':
      if (msg.success) {
        console.log(`[${timestamp}] ✅ Command ${msg.id} succeeded\n`)
      } else {
        console.log(`[${timestamp}] ❌ Command ${msg.id} failed\n`)
      }
      break

    case 'query:response':
      console.log(`[${timestamp}] 📋 Query ${msg.id} result: ${msg.payload.tuples.length} items`)
      if (msg.payload.tuples.length === 1) {
        // Single result: show full JSON for easy copying
        const [key, value] = msg.payload.tuples[0]
        console.log(`  ${key}:`)
        console.log(JSON.stringify(value, null, 2))
      } else {
        msg.payload.tuples.slice(0, 10).forEach(([key, value]) => {
          const preview = JSON.stringify(value).substring(0, 250)
          console.log(`  ${key}: ${preview}${preview.length >= 250 ? '...' : ''}`)
        })
        if (msg.payload.tuples.length > 10) {
          console.log(`  ... and ${msg.payload.tuples.length - 10} more`)
        }
      }
      console.log()
      break

    case 'view:response':
      console.log(`[${timestamp}] 🗺️  View ${msg.id} result:`)
      console.log(JSON.stringify(msg.payload, null, 2))
      console.log()
      break

    case 'error':
      console.log(`[${timestamp}] ❌ Error (${msg.error.code}): ${msg.error.message}\n`)
      break

    default:
      console.log(`[${timestamp}] Unknown message type: ${msg.type}`)
      console.log(JSON.stringify(msg, null, 2))
  }
}

function sendCommand(action, payload) {
  if (!clientSocket) {
    console.log('⚠️  No client connected\n')
    return
  }

  const msg = {
    type: 'command',
    id: `cmd-${messageId++}`,
    payload: { action, ...payload }
  }

  clientSocket.send(JSON.stringify(msg))
  console.log(`📤 Sent command: ${action}\n`)
}

function sendQuery(prefix) {
  if (!clientSocket) {
    console.log('⚠️  No client connected\n')
    return
  }

  const msg = {
    type: 'query',
    id: `qry-${messageId++}`,
    payload: { prefix }
  }

  clientSocket.send(JSON.stringify(msg))
  console.log(`📤 Sent query for prefix: ${prefix}\n`)
}

function sendView(action, payload = {}) {
  if (!clientSocket) {
    console.log('⚠️  No client connected\n')
    return
  }

  const msg = {
    type: 'view',
    id: `view-${messageId++}`,
    payload: { action, ...payload }
  }

  clientSocket.send(JSON.stringify(msg))
  console.log(`📤 Sent view command: ${action}\n`)
}

// Interactive CLI
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
})

rl.prompt()

rl.on('line', (line) => {
  const input = line.trim()
  const parts = input.split(' ')
  const cmd = parts[0]

  switch (cmd) {
    case 'query':
      if (parts[1]) {
        sendQuery(parts[1])
      } else {
        console.log('Usage: query <prefix>\n')
      }
      break

    case 'put':
      if (parts[1] && parts[2]) {
        try {
          const key = parts[1]
          const value = JSON.parse(parts.slice(2).join(' '))
          sendCommand('put', { key, value })
        } catch (e) {
          console.log('Invalid JSON value\n')
        }
      } else {
        console.log('Usage: put <key> <json>\n')
      }
      break

    case 'del':
      if (parts[1]) {
        sendCommand('del', { key: parts[1] })
      } else {
        console.log('Usage: del <key>\n')
      }
      break

    case 'flyto':
      if (parts[1] && parts[2]) {
        const lon = parseFloat(parts[1])
        const lat = parseFloat(parts[2])
        if (!isNaN(lon) && !isNaN(lat)) {
          sendView('flyto', { center: [lon, lat] })
        } else {
          console.log('Invalid coordinates\n')
        }
      } else {
        console.log('Usage: flyto <lon> <lat>\n')
      }
      break

    case 'getview':
      sendView('get')
      break

    case 'quit':
    case 'exit':
      console.log('Goodbye!\n')
      process.exit(0)
      break

    case '':
      break

    default:
      console.log(`Unknown command: ${cmd}\n`)
  }

  rl.prompt()
})

rl.on('close', () => {
  process.exit(0)
})
