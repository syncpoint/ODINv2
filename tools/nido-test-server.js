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

function showHelp() {
  console.log('Commands:')
  console.log('  query <prefix>     - Query data (e.g., "query layer:")')
  console.log('  put <key> <json>   - Put a value (supports multi-line JSON)')
  console.log('  del <key>          - Delete a key')
  console.log('  batch <json>       - Batch operations (array of {type, key, value})')
  console.log('  flyto <lon> <lat>  - Fly to coordinates (e.g., "flyto 16.37 48.21")')
  console.log('  getview            - Get current map view state')
  console.log('  help, ?            - Show this help')
  console.log('  quit               - Exit server')
  console.log('')
  console.log('Multi-line input: paste JSON, press Enter on empty line to submit, "cancel" to abort.\n')
}

console.log(`\n🚀 NIDO Test Server running on ws://localhost:${port}\n`)
console.log('Waiting for ODIN to connect...\n')
showHelp()

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
      if (msg.payload.operations.length === 1) {
        // Single operation: show full JSON for easy copying
        const op = msg.payload.operations[0]
        if (op.type === 'put') {
          console.log(`  PUT ${op.key}:`)
          console.log(JSON.stringify(op.value, null, 2))
        } else {
          console.log(`  DEL ${op.key}`)
        }
      } else {
        msg.payload.operations.forEach((op, i) => {
          if (op.type === 'put') {
            const preview = JSON.stringify(op.value).substring(0, 260)
            console.log(`  ${i + 1}. PUT ${op.key} = ${preview}${preview.length >= 260 ? '...' : ''}`)
          } else {
            console.log(`  ${i + 1}. DEL ${op.key}`)
          }
        })
      }
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

function sendBatch(operations) {
  if (!clientSocket) {
    console.log('⚠️  No client connected\n')
    return
  }

  const msg = {
    type: 'command',
    id: `cmd-${messageId++}`,
    payload: { action: 'batch', operations }
  }

  clientSocket.send(JSON.stringify(msg))
  console.log(`📤 Sent batch with ${operations.length} operations\n`)
}

// Interactive CLI with multi-line JSON support
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
})

// Multi-line input state
let bufferMode = null // null, 'put', or 'batch'
let bufferKey = null
let bufferLines = []

function setPrompt(multiLine) {
  rl.setPrompt(multiLine ? '... ' : '> ')
}

function countBraces(str) {
  let braces = 0
  let brackets = 0
  let inString = false
  let escape = false

  for (const char of str) {
    if (escape) {
      escape = false
      continue
    }
    if (char === '\\') {
      escape = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (char === '{') braces++
    else if (char === '}') braces--
    else if (char === '[') brackets++
    else if (char === ']') brackets--
  }

  return { braces, brackets, balanced: braces === 0 && brackets === 0 }
}

function tryParseJson(str) {
  try {
    return { success: true, value: JSON.parse(str) }
  } catch (e) {
    return { success: false, error: e }
  }
}

function processBuffer() {
  const jsonStr = bufferLines.join('\n')
  const counts = countBraces(jsonStr)

  // Only try to parse when braces are balanced
  if (!counts.balanced) {
    return false
  }

  const result = tryParseJson(jsonStr)
  if (result.success) {
    if (bufferMode === 'put') {
      sendCommand('put', { key: bufferKey, value: result.value })
    } else if (bufferMode === 'batch') {
      // Expect an array of operations
      if (Array.isArray(result.value)) {
        sendBatch(result.value)
      } else {
        console.log('Batch must be an array of operations\n')
      }
    }
    resetBuffer()
    return true
  }
  return false
}

function resetBuffer() {
  bufferMode = null
  bufferKey = null
  bufferLines = []
  setPrompt(false)
}

function startBuffer(mode, key = null, initialLine = '') {
  bufferMode = mode
  bufferKey = key
  bufferLines = initialLine ? [initialLine] : []

  // Check if initial line is already complete
  if (initialLine && processBuffer()) {
    return
  }

  console.log('(paste JSON, then press Enter on empty line to submit, or type "cancel")')
  setPrompt(true)
  rl.prompt()
}

rl.prompt()

rl.on('line', (line) => {
  // Handle multi-line buffer mode
  if (bufferMode) {
    const trimmed = line.trim().toLowerCase()

    if (trimmed === 'cancel') {
      console.log('Cancelled.\n')
      resetBuffer()
      rl.prompt()
      return
    }

    if (line === '' && bufferLines.length > 0) {
      // Empty line = try to submit
      const jsonStr = bufferLines.join('\n')
      const result = tryParseJson(jsonStr)

      if (result.success) {
        if (bufferMode === 'put') {
          sendCommand('put', { key: bufferKey, value: result.value })
        } else if (bufferMode === 'batch') {
          if (Array.isArray(result.value)) {
            sendBatch(result.value)
          } else {
            console.log('Batch must be an array of operations\n')
          }
        }
        resetBuffer()
      } else {
        console.log(`JSON parse error: ${result.error.message}`)
        console.log('Continue typing or "cancel" to abort.\n')
        setPrompt(true)
      }
      rl.prompt()
      return
    }

    if (line !== '') {
      bufferLines.push(line)
    }
    rl.prompt()
    return
  }

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
      if (parts[1]) {
        const key = parts[1]
        const jsonPart = parts.slice(2).join(' ')

        if (jsonPart) {
          // Try to parse inline JSON
          const result = tryParseJson(jsonPart)
          if (result.success) {
            sendCommand('put', { key, value: result.value })
            break
          }
        }
        // Start multi-line mode
        startBuffer('put', key, jsonPart)
        return // Don't prompt, startBuffer handles it
      } else {
        console.log('Usage: put <key> <json>\n')
      }
      break

    case 'batch':
      // Start collecting batch operations
      const batchJsonPart = parts.slice(1).join(' ')
      if (batchJsonPart) {
        const result = tryParseJson(batchJsonPart)
        if (result.success) {
          if (Array.isArray(result.value)) {
            sendBatch(result.value)
          } else {
            console.log('Batch must be an array of operations\n')
          }
          break
        }
      }
      startBuffer('batch', null, batchJsonPart)
      return // Don't prompt, startBuffer handles it

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

    case 'help':
    case '?':
      showHelp()
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
