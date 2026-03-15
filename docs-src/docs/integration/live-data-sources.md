# Live Data Source

The Live Data Source feature allows ODIN to receive and display real-time geospatial data from external systems via Server-Sent Events (SSE).

## Use Cases

- **Real-time tracking**: Display moving assets such as vehicles, aircraft, or personnel on the map
- **Sensor data visualization**: Show live sensor readings with geographic positions
- **Situational awareness**: Integrate external data feeds into your operational picture
- **IoT integration**: Display data from IoT devices with location information

## Creating a Live Data Source

1. Click the **+** button in the toolbar
2. Select **Create Live Data Source**
3. Configure the connection parameters:
   - **Name**: A descriptive name for the data source
   - **URL**: The SSE endpoint URL
   - **Event Type**: The SSE event name to listen for (default: `message`)
   - **Update Interval**: Rate limiting in milliseconds (default: 100ms)
   - **Track features by ID**: How to handle incoming features (see below)
4. Enable the checkbox to connect

### Feature Tracking Modes

The **Track features by ID** option controls how incoming features are processed:

**Enabled (default)**: Features are tracked by their `id` field. When a feature with the same ID arrives, it updates the existing feature (position, properties). This is ideal for tracking moving assets where each asset has a unique identifier.

**Disabled**: All features are replaced on each update. The previous features are cleared and new features are added. This mode is suitable for data sources that:
- Don't provide feature IDs
- Send complete snapshots of all features on each update
- Have features that don't need individual tracking

## SSE Endpoint Requirements

The SSE endpoint must comply with the [Server-Sent Events specification](https://html.spec.whatwg.org/multipage/server-sent-events.html).

### HTTP Response Headers

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### CORS

If the SSE endpoint is on a different origin than ODIN, it must include appropriate CORS headers:

```
Access-Control-Allow-Origin: *
```

### Event Format

Events should be sent in the standard SSE format:

```
event: <event-type>
data: <json-payload>

```

Note: Each event must end with two newlines.

If using the default event type (`message`), the `event:` line can be omitted:

```
data: <json-payload>

```

## Data Format

The data payload must be valid GeoJSON. Two formats are supported:

### Single Feature

```json
{
  "type": "Feature",
  "id": "unit-001",
  "geometry": {
    "type": "Point",
    "coordinates": [16.3738, 48.2082]
  },
  "properties": {
    "sidc": "SFGPUCI----D",
    "name": "Alpha Unit"
  }
}
```

### Feature Collection

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "unit-001",
      "geometry": {
        "type": "Point",
        "coordinates": [16.3738, 48.2082]
      },
      "properties": {
        "sidc": "SFGPUCI----D",
        "name": "Alpha Unit"
      }
    },
    {
      "type": "Feature",
      "id": "unit-002",
      "geometry": {
        "type": "Point",
        "coordinates": [16.3850, 48.2100]
      },
      "properties": {
        "sidc": "SFGPUCI----D",
        "name": "Bravo Unit"
      }
    }
  ]
}
```

### Required Fields

| Field | Description |
|-------|-------------|
| `type` | Must be `"Feature"` or `"FeatureCollection"` |
| `id` | Unique identifier for the feature. Required when "Track features by ID" is enabled. Used to update existing features. |
| `geometry` | GeoJSON geometry object |
| `geometry.type` | Geometry type (e.g., `"Point"`, `"LineString"`, `"Polygon"`) |
| `geometry.coordinates` | Coordinates in the configured projection (default: EPSG:4326 / WGS84) |

### Optional Fields

| Field | Description |
|-------|-------------|
| `properties.sidc` | MIL-STD-2525C symbol identification code for military symbology |
| `properties.name` | Display name for the feature |
| `properties.*` | Any additional properties for styling or information |

### Coordinate System

By default, coordinates are expected in **EPSG:4326 (WGS84)** format:
- Longitude first, then latitude: `[longitude, latitude]`
- Example: `[16.3738, 48.2082]` for Vienna, Austria

The data projection can be configured in the Live Data Source settings if your endpoint uses a different coordinate system.

## Example SSE Server (Node.js)

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial data
    const sendUpdate = () => {
      const data = {
        type: 'Feature',
        id: 'track-001',
        geometry: {
          type: 'Point',
          coordinates: [16.37 + Math.random() * 0.1, 48.20 + Math.random() * 0.1]
        },
        properties: {
          sidc: 'SFGPUCI----D',
          name: 'Moving Unit'
        }
      };

      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send updates every second
    const interval = setInterval(sendUpdate, 1000);
    sendUpdate();

    req.on('close', () => {
      clearInterval(interval);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3000, () => {
  console.log('SSE server running on http://localhost:3000/api/stream');
});
```

## Troubleshooting

### Connection Issues

- Verify the URL is correct and accessible
- Check browser developer tools for CORS errors
- Ensure the server sends proper SSE headers

### Features Not Appearing

- Verify the JSON payload is valid
- If "Track features by ID" is enabled, check that the `id` field is present on each feature
- If your data source doesn't provide IDs, disable "Track features by ID"
- Ensure coordinates are in the correct order (longitude, latitude)
- Verify the event type matches the configured value

### Features Not Updating

- Ensure "Track features by ID" is enabled
- Ensure each update uses the same `id` for features that should be updated
- Check the update interval setting - very low values may cause performance issues
