# NIDO - External Integration API

NIDO (ODIN reversed) is a WebSocket-based API that enables external applications to integrate with ODIN in real-time. Connected tools can receive live updates when data changes and send commands to create, modify, or delete project data.

## Table of Contents

- [Security Warning](#security-warning)
- [Overview](#overview)
- [Connection Management](#connection-management)
  - [Establishing a Connection](#establishing-a-connection)
  - [Connection States](#connection-states)
  - [Troubleshooting](#troubleshooting)
- [Protocol Reference](#protocol-reference)
  - [Message Format](#message-format)
  - [Incoming Messages (Server → ODIN)](#incoming-messages-server--odin)
  - [Outgoing Messages (ODIN → Server)](#outgoing-messages-odin--server)
- [Data Operations](#data-operations)
  - [Layers](#layers)
  - [Features](#features)
  - [Markers](#markers)
  - [Bookmarks](#bookmarks)
  - [Tags](#tags)
  - [Links](#links)
  - [Visibility (Hidden)](#visibility-hidden)
  - [Locking](#locking)
  - [Styles](#styles)
- [View Control](#view-control)
- [Coordinate System](#coordinate-system)
- [Complete Workflow Example](#complete-workflow-example)
- [Test Server](#test-server)

---

## Security Warning

> **WARNING: NIDO allows external applications to read and modify ALL data in your project.**
>
> - Any connected server can **read** all layers, features, markers, and other project data
> - Any connected server can **create, modify, or delete** data in your project
> - Changes made via NIDO are **immediate and may be difficult to undo**
> - There is **no authentication** built into the NIDO protocol itself
>
> **Only connect to WebSocket servers that you fully trust.**
>
> If you are unsure about a server's trustworthiness, do not enable the connection.

---

## Overview

NIDO provides bidirectional communication between ODIN and external applications:

**ODIN sends to external server:**
- Connection information (project ID, name, ODIN version)
- Real-time batch events when data changes
- Responses to queries and commands

**External server can send to ODIN:**
- Commands to create, update, or delete data
- Queries to retrieve data by prefix
- View commands to control the map

### Use Cases

- **Digital Twin**: Mirror ODIN data in an external system
- **Automation**: Programmatically create or update features
- **Integration**: Connect ODIN to other C2 systems or data sources
- **Analysis**: Export data to external analytics tools in real-time

---

## Connection Management

### Establishing a Connection

1. Click the **LAN icon** in the ODIN toolbar (left side)
2. Enter the WebSocket URL of your server (e.g., `ws://localhost:9000`)
3. Check **Enable connection**

The connection status badge indicates:
- **Green**: Connected successfully
- **Red**: Enabled but connection failed
- **Gray**: Disabled

### Connection States

When ODIN connects, it sends a `connected` message:

```json
{
  "type": "connected",
  "payload": {
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "projectName": "My Project",
    "odinVersion": "3.1.0",
    "clientId": "unique-client-uuid"
  }
}
```

ODIN automatically attempts to reconnect with exponential backoff if the connection is lost.

### Troubleshooting

| Problem | Possible Cause | Solution |
|---------|----------------|----------|
| Red badge, no connection | Server not running | Start your WebSocket server |
| Red badge, connection refused | Wrong URL or port | Verify the WebSocket URL |
| Red badge, connection drops | Network issues | Check network connectivity |
| No data received | Not subscribed to events | Ensure server handles `batch` messages |
| Commands fail | Invalid key format | Check key prefix is valid |
| Coordinates wrong | Projection mismatch | NIDO uses EPSG:4326 (lon/lat) |

---

## Protocol Reference

### Message Format

All messages are JSON objects with a `type` field. Commands and queries include an `id` field for correlating responses.

### Incoming Messages (Server → ODIN)

#### Command

Execute data operations (put, del, batch).

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "layer:uuid-here",
    "value": { "name": "My Layer" }
  }
}
```

#### Query

Retrieve data by key prefix.

```json
{
  "type": "query",
  "id": "qry-1",
  "payload": {
    "prefix": "layer:"
  }
}
```

#### View

Control the map view.

```json
{
  "type": "view",
  "id": "view-1",
  "payload": {
    "action": "flyto",
    "center": [16.37, 48.21]
  }
}
```

### Outgoing Messages (ODIN → Server)

#### connected

Sent when connection is established.

#### batch

Sent when data changes in ODIN.

```json
{
  "type": "batch",
  "payload": {
    "operations": [
      { "type": "put", "key": "feature:...", "value": {...} },
      { "type": "del", "key": "feature:..." }
    ],
    "timestamp": 1699876543210
  }
}
```

#### command:response

```json
{
  "type": "command:response",
  "id": "cmd-1",
  "success": true
}
```

#### query:response

```json
{
  "type": "query:response",
  "id": "qry-1",
  "success": true,
  "payload": {
    "tuples": [
      ["layer:uuid-1", { "name": "Layer 1" }],
      ["layer:uuid-2", { "name": "Layer 2" }]
    ]
  }
}
```

#### view:response

```json
{
  "type": "view:response",
  "id": "view-1",
  "success": true,
  "payload": {
    "center": [16.37, 48.21],
    "zoom": 12,
    "resolution": 38.21,
    "rotation": 0
  }
}
```

#### error

```json
{
  "type": "error",
  "id": "cmd-1",
  "error": {
    "code": "INVALID_KEY",
    "message": "Invalid key: invalid:prefix"
  }
}
```

Error codes: `INVALID_MESSAGE`, `INVALID_KEY`, `INVALID_ACTION`, `COMMAND_FAILED`, `QUERY_FAILED`

---

## Data Operations

### Valid Key Prefixes

| Prefix | Description | Requires Geometry |
|--------|-------------|-------------------|
| `layer:` | Map layers | No |
| `feature:` | Features within layers | Yes |
| `marker:` | Map markers | Yes |
| `bookmark:` | Saved map views | No |
| `place:` | Search result places | No |
| `link+` | Links between entities | No |
| `tags+` | Tags for entities | No |
| `hidden+` | Visibility flags | No |
| `locked+` | Lock flags | No |
| `style+` | Style overrides | No |

---

### Layers

Layers are containers for features.

**Key format:** `layer:{uuid}`

**Structure:**
```json
{
  "name": "Layer Name"
}
```

#### Create a Layer

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "layer:550e8400-e29b-41d4-a716-446655440001",
    "value": {
      "name": "Operations Layer"
    }
  }
}
```

#### Query All Layers

```json
{
  "type": "query",
  "id": "qry-1",
  "payload": { "prefix": "layer:" }
}
```

#### Delete a Layer

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "del",
    "key": "layer:550e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

### Features

Features are military symbols or geometric shapes within a layer.

**Key format:** `feature:{layer-uuid}/{feature-uuid}`

**Structure:**
```json
{
  "type": "Feature",
  "name": "Optional display name",
  "geometry": {
    "type": "Point",
    "coordinates": [16.37, 48.21]
  },
  "properties": {
    "sidc": "SFGPUCI----D---",
    "t": "Designator text",
    "t1": "Additional info"
  }
}
```

#### Geometry Types

- `Point` - Single coordinate
- `LineString` - Array of coordinates
- `Polygon` - Array of coordinate rings
- `MultiPoint` - Multiple points
- `GeometryCollection` - Mixed geometries

#### Create a Feature (Infantry Unit)

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "feature:550e8400-e29b-41d4-a716-446655440001/660e8400-e29b-41d4-a716-446655440002",
    "value": {
      "type": "Feature",
      "name": "Alpha Company",
      "geometry": {
        "type": "Point",
        "coordinates": [16.3738, 48.2082]
      },
      "properties": {
        "sidc": "SFGPUCI----D---",
        "t": "A/1-1"
      }
    }
  }
}
```

#### Create a Line Feature (Boundary)

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "feature:550e8400-e29b-41d4-a716-446655440001/770e8400-e29b-41d4-a716-446655440003",
    "value": {
      "type": "Feature",
      "name": "Phase Line Alpha",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [16.35, 48.20],
          [16.38, 48.21],
          [16.40, 48.19]
        ]
      },
      "properties": {
        "sidc": "GFGPGLB----K---"
      }
    }
  }
}
```

#### Create a Polygon Feature (Area)

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "feature:550e8400-e29b-41d4-a716-446655440001/880e8400-e29b-41d4-a716-446655440004",
    "value": {
      "type": "Feature",
      "name": "Assembly Area",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [16.35, 48.20],
          [16.40, 48.20],
          [16.40, 48.22],
          [16.35, 48.22],
          [16.35, 48.20]
        ]]
      },
      "properties": {
        "sidc": "GFGPGAA----K---"
      }
    }
  }
}
```

#### Query Features in a Layer

```json
{
  "type": "query",
  "id": "qry-1",
  "payload": { "prefix": "feature:550e8400-e29b-41d4-a716-446655440001/" }
}
```

#### Update a Feature

Send a `put` command with the same key and updated value:

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "feature:550e8400-e29b-41d4-a716-446655440001/660e8400-e29b-41d4-a716-446655440002",
    "value": {
      "type": "Feature",
      "name": "Alpha Company (Renamed)",
      "geometry": {
        "type": "Point",
        "coordinates": [16.38, 48.22]
      },
      "properties": {
        "sidc": "SFGPUCI----D---",
        "t": "A/1-1",
        "t1": "On objective"
      }
    }
  }
}
```

---

### Markers

Markers are simple point indicators on the map.

**Key format:** `marker:{uuid}`

**Structure:**
```json
{
  "name": "Marker Name",
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [16.37, 48.21]
  }
}
```

#### Create a Marker

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "marker:990e8400-e29b-41d4-a716-446655440005",
    "value": {
      "name": "Rally Point",
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [16.40, 48.25]
      }
    }
  }
}
```

---

### Bookmarks

Bookmarks save map view positions for quick navigation.

**Key format:** `bookmark:{uuid}`

**Structure:**
```json
{
  "name": "Bookmark Name",
  "center": [16.37, 48.21],
  "zoom": 12,
  "resolution": 38.21,
  "rotation": 0
}
```

#### Create a Bookmark

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "bookmark:aa0e8400-e29b-41d4-a716-446655440006",
    "value": {
      "name": "Objective Area",
      "center": [16.37, 48.21],
      "zoom": 14,
      "resolution": 9.55,
      "rotation": 0
    }
  }
}
```

---

### Tags

Tags are labels attached to layers, features, or other entities.

**Key format:** `tags+{entity-key}`

**Structure:** Array of tag strings
```json
["tag1", "tag2", "PRIORITY"]
```

#### Add Tags to a Layer

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "tags+layer:550e8400-e29b-41d4-a716-446655440001",
    "value": ["OPERATIONS", "FRIENDLY", "ACTIVE"]
  }
}
```

#### Add Tags to a Feature

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "tags+feature:550e8400-e29b-41d4-a716-446655440001/660e8400-e29b-41d4-a716-446655440002",
    "value": ["PRIORITY", "MANEUVER"]
  }
}
```

#### Remove Tags

Delete the tags entry to remove all tags:

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "del",
    "key": "tags+feature:550e8400-e29b-41d4-a716-446655440001/660e8400-e29b-41d4-a716-446655440002"
  }
}
```

Or update with a reduced list:

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "tags+feature:...",
    "value": ["PRIORITY"]
  }
}
```

#### Query All Tags

```json
{
  "type": "query",
  "id": "qry-1",
  "payload": { "prefix": "tags+" }
}
```

---

### Links

Links attach external resources (URLs or files) to layers or features.

**Key format:** `link+{entity-key}/{link-uuid}`

**Structure:**
```json
{
  "name": "Link description",
  "url": "https://example.com or file:///path/to/file"
}
```

#### Link to an External Website

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "link+layer:550e8400-e29b-41d4-a716-446655440001/bb0e8400-e29b-41d4-a716-446655440007",
    "value": {
      "name": "ODIN Documentation",
      "url": "https://odin.syncpoint.io"
    }
  }
}
```

#### Link to a Local File

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "link+feature:550e8400-e29b-41d4-a716-446655440001/660e8400-e29b-41d4-a716-446655440002/cc0e8400-e29b-41d4-a716-446655440008",
    "value": {
      "name": "Mission Briefing",
      "url": "file:///Users/commander/Documents/briefing.pdf"
    }
  }
}
```

#### Query Links for an Entity

```json
{
  "type": "query",
  "id": "qry-1",
  "payload": { "prefix": "link+layer:550e8400-e29b-41d4-a716-446655440001/" }
}
```

---

### Visibility (Hidden)

Control whether layers or features are visible on the map.

**Key format:** `hidden+{entity-key}`

**Structure:** `true` (hidden) or delete to show

#### Hide a Layer

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "hidden+layer:550e8400-e29b-41d4-a716-446655440001",
    "value": true
  }
}
```

#### Show a Layer (Remove Hidden Flag)

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "del",
    "key": "hidden+layer:550e8400-e29b-41d4-a716-446655440001"
  }
}
```

#### Query Hidden State

```json
{
  "type": "query",
  "id": "qry-1",
  "payload": { "prefix": "hidden+" }
}
```

---

### Locking

Prevent accidental edits to layers or features.

**Key format:** `locked+{entity-key}`

**Structure:** `true` (locked) or delete to unlock

#### Lock a Layer

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "locked+layer:550e8400-e29b-41d4-a716-446655440001",
    "value": true
  }
}
```

#### Unlock a Layer

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "del",
    "key": "locked+layer:550e8400-e29b-41d4-a716-446655440001"
  }
}
```

#### Lock a Feature

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "locked+feature:550e8400-e29b-41d4-a716-446655440001/660e8400-e29b-41d4-a716-446655440002",
    "value": true
  }
}
```

---

### Styles

Override default styling for layers or features.

**Key format:** `style+{entity-key}`

**Structure:** Style object with optional properties

#### Set Layer Style

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "style+layer:550e8400-e29b-41d4-a716-446655440001",
    "value": {
      "stroke-color": "#ff0000",
      "stroke-width": 3,
      "fill-color": "rgba(255, 0, 0, 0.2)"
    }
  }
}
```

#### Reset Style to Default

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "del",
    "key": "style+layer:550e8400-e29b-41d4-a716-446655440001"
  }
}
```

---

## View Control

Control the map view programmatically.

### Fly to Location

Animates the map to center on a location.

```json
{
  "type": "view",
  "id": "view-1",
  "payload": {
    "action": "flyto",
    "center": [16.37, 48.21]
  }
}
```

### Get Current View

Retrieve the current map view state.

```json
{
  "type": "view",
  "id": "view-2",
  "payload": {
    "action": "get"
  }
}
```

**Response:**
```json
{
  "type": "view:response",
  "id": "view-2",
  "success": true,
  "payload": {
    "center": [16.37, 48.21],
    "zoom": 12,
    "resolution": 38.21,
    "rotation": 0
  }
}
```

---

## Coordinate System

**All coordinates in the NIDO API use EPSG:4326 (WGS84) format:**
- Format: `[longitude, latitude]`
- Longitude: -180 to 180 (East is positive)
- Latitude: -90 to 90 (North is positive)

**Example:** Vienna, Austria = `[16.3738, 48.2082]`

ODIN internally uses EPSG:3857 (Web Mercator), but all NIDO communications are automatically converted.

---

## Complete Workflow Example

This example demonstrates a complete workflow: creating a layer, adding features, tagging them, and managing visibility.

### Step 1: Create a Layer

```json
{
  "type": "command",
  "id": "cmd-1",
  "payload": {
    "action": "put",
    "key": "layer:11111111-1111-1111-1111-111111111111",
    "value": { "name": "Blue Force Tracking" }
  }
}
```

### Step 2: Add Features

```json
{
  "type": "command",
  "id": "cmd-2",
  "payload": {
    "action": "batch",
    "operations": [
      {
        "type": "put",
        "key": "feature:11111111-1111-1111-1111-111111111111/aaaa-1111",
        "value": {
          "type": "Feature",
          "name": "HQ Element",
          "geometry": { "type": "Point", "coordinates": [16.37, 48.20] },
          "properties": { "sidc": "SFGPUH----H---" }
        }
      },
      {
        "type": "put",
        "key": "feature:11111111-1111-1111-1111-111111111111/aaaa-2222",
        "value": {
          "type": "Feature",
          "name": "Alpha Team",
          "geometry": { "type": "Point", "coordinates": [16.38, 48.21] },
          "properties": { "sidc": "SFGPUCI----D---", "t": "A" }
        }
      },
      {
        "type": "put",
        "key": "feature:11111111-1111-1111-1111-111111111111/aaaa-3333",
        "value": {
          "type": "Feature",
          "name": "Bravo Team",
          "geometry": { "type": "Point", "coordinates": [16.39, 48.22] },
          "properties": { "sidc": "SFGPUCI----D---", "t": "B" }
        }
      }
    ]
  }
}
```

### Step 3: Add Tags

```json
{
  "type": "command",
  "id": "cmd-3",
  "payload": {
    "action": "batch",
    "operations": [
      {
        "type": "put",
        "key": "tags+layer:11111111-1111-1111-1111-111111111111",
        "value": ["BLUE", "TRACKING", "ACTIVE"]
      },
      {
        "type": "put",
        "key": "tags+feature:11111111-1111-1111-1111-111111111111/aaaa-1111",
        "value": ["HQ", "COMMAND"]
      }
    ]
  }
}
```

### Step 4: Lock the HQ Element

```json
{
  "type": "command",
  "id": "cmd-4",
  "payload": {
    "action": "put",
    "key": "locked+feature:11111111-1111-1111-1111-111111111111/aaaa-1111",
    "value": true
  }
}
```

### Step 5: Hide Bravo Team

```json
{
  "type": "command",
  "id": "cmd-5",
  "payload": {
    "action": "put",
    "key": "hidden+feature:11111111-1111-1111-1111-111111111111/aaaa-3333",
    "value": true
  }
}
```

### Step 6: Update Alpha Team Position

```json
{
  "type": "command",
  "id": "cmd-6",
  "payload": {
    "action": "put",
    "key": "feature:11111111-1111-1111-1111-111111111111/aaaa-2222",
    "value": {
      "type": "Feature",
      "name": "Alpha Team",
      "geometry": { "type": "Point", "coordinates": [16.40, 48.23] },
      "properties": { "sidc": "SFGPUCI----D---", "t": "A" }
    }
  }
}
```

### Step 7: Fly to the Layer Area

```json
{
  "type": "view",
  "id": "view-1",
  "payload": {
    "action": "flyto",
    "center": [16.38, 48.21]
  }
}
```

### Step 8: Remove a Tag from the Layer

```json
{
  "type": "command",
  "id": "cmd-7",
  "payload": {
    "action": "put",
    "key": "tags+layer:11111111-1111-1111-1111-111111111111",
    "value": ["BLUE", "TRACKING"]
  }
}
```

### Step 9: Show Bravo Team Again

```json
{
  "type": "command",
  "id": "cmd-8",
  "payload": {
    "action": "del",
    "key": "hidden+feature:11111111-1111-1111-1111-111111111111/aaaa-3333"
  }
}
```

### Step 10: Unlock HQ Element

```json
{
  "type": "command",
  "id": "cmd-9",
  "payload": {
    "action": "del",
    "key": "locked+feature:11111111-1111-1111-1111-111111111111/aaaa-1111"
  }
}
```

---

## Test Server

ODIN includes a test server for development and testing at `tools/nido-test-server.js`.

### Starting the Server

```bash
node tools/nido-test-server.js [port]
```

Default port is 9000.

### Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `query <prefix>` | Query data by prefix | `query layer:` |
| `put <key> <json>` | Create or update data | `put layer:test {"name":"Test"}` |
| `del <key>` | Delete data | `del layer:test` |
| `flyto <lon> <lat>` | Fly to coordinates | `flyto 16.37 48.21` |
| `getview` | Get current view state | `getview` |
| `quit` | Exit server | `quit` |

### Example Session

```
$ node tools/nido-test-server.js

🚀 NIDO Test Server running on ws://localhost:9000

Waiting for ODIN to connect...

✅ ODIN connected!

[12:34:56] 📡 CONNECTED
  Project: My Project (a1b2c3d4-...)
  ODIN Version: 3.1.0
  Client ID: xyz-123-...

> query layer:
📤 Sent query for prefix: layer:

[12:34:58] 📋 Query qry-1 result: 2 items
  layer:abc-123: {"name":"Operations"}
  layer:def-456: {"name":"Intelligence"}

> flyto 16.37 48.21
📤 Sent view command: flyto

[12:35:02] ✅ Command view-1 succeeded

> quit
Goodbye!
```

---

## Appendix: SIDC Codes

Features use Symbol Identification Codes (SIDC) based on MIL-STD-2525C. Common examples:

| SIDC | Description |
|------|-------------|
| `SFGPUCI----D---` | Friendly Infantry Unit |
| `SFGPUCIZ---D---` | Friendly Mechanized Infantry |
| `SFGPUCA----D---` | Friendly Armor Unit |
| `SFGPUH----H---` | Friendly Headquarters |
| `SHGPUCI----D---` | Hostile Infantry Unit |
| `GFGPGLB----K---` | Boundary Line |
| `GFGPGAA----K---` | Assembly Area |

For a complete reference, see the MIL-STD-2525C specification.
