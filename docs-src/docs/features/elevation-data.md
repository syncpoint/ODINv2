# Elevation Data and Elevation Profile

ODIN supports RGB-encoded terrain tiles for displaying elevation data. When configured, elevation information is shown at the cursor position and can be used to generate elevation profiles along lines.

## Setting Up Elevation Data

Elevation data is provided through tile services that encode elevation values in the RGB channels of each pixel (Mapbox Terrain-RGB format). ODIN supports three tile service types as terrain sources:

- **XYZ** — direct `{z}/{x}/{y}` tile URL
- **TileJSON** — a single TileJSON endpoint
- **TileJSON Discovery** — a server (e.g. [mbtileserver](https://github.com/consbio/mbtileserver)) that exposes multiple tilesets, any of which can individually be marked as terrain

### Step 1: Add a Terrain Tile Service

1. Press `Ctrl+N` followed by `T` to create a new tile service
2. In the **URL** field, enter the address of your terrain tile server
3. Press `Tab` or click outside the field to confirm

ODIN automatically detects the service type from the URL response.

### Step 2: Mark as Terrain Data

**For XYZ and TileJSON services:**

1. In the tile service properties, enable the **RGB-encoded terrain data** checkbox
2. This tells ODIN to interpret the tile pixels as elevation values instead of displaying them as a visible map layer

**For TileJSON Discovery services:**

A discovery endpoint may expose multiple tilesets — some may be regular map tiles, others may contain elevation data. Terrain is configured per tileset:

1. In the layer list, select the tileset that contains elevation data
2. Enable the **RGB-encoded terrain data** checkbox
3. Repeat for any additional terrain tilesets

Each discovered tileset can be independently marked as terrain or left as a regular map layer.

The terrain layer will be active but invisible on the map. Elevation values are decoded using the Mapbox Terrain-RGB formula:

```
elevation = -10000 + (R * 65536 + G * 256 + B) * 0.1
```

### Step 3: Verify

Once configured, the current elevation is displayed in the on-screen display (bottom-right corner) as you move the cursor over the map.

## Elevation Profile

The Elevation Profile tool generates a chart showing elevation (Y-axis) vs. distance (X-axis) along a line. It works independently of the current map viewport — even parts of the line that extend beyond the visible area are sampled correctly.

### Creating an Elevation Profile

There are two ways to create an elevation profile:

#### Option A: From a Selected Feature

1. Select an existing feature with a LineString geometry on the map
2. Open the measure dropdown in the toolbar (ruler icon)
3. Click **Elevation Profile**
4. The profile chart appears at the bottom of the screen

#### Option B: By Drawing a Line

1. Make sure no LineString feature is selected
2. Open the measure dropdown and click **Elevation Profile**
3. Draw a line on the map by clicking to place points
4. Double-click to finish the line
5. The profile chart appears at the bottom of the screen

### Reading the Profile Chart

The chart displays:

- **X-axis**: Distance along the line (in meters or kilometers)
- **Y-axis**: Elevation (in meters), auto-scaled to the data range
- **Orange filled area**: The elevation curve along the line
- **Dashed vertical lines**: Segment boundaries (see below)

#### Header Statistics

The header bar shows summary statistics for the profile:

| Statistic | Description |
|-----------|-------------|
| **Min** | Lowest elevation along the line |
| **Max** | Highest elevation along the line |
| **Dist** | Total geodesic length of the line |
| **&uarr;** | Total ascent (cumulative elevation gain) |
| **&darr;** | Total descent (cumulative elevation loss) |

#### Segment Markers

When the profile is based on a line with multiple segments (more than two vertices), dashed vertical lines appear in the chart at the distance where each segment boundary (vertex) is located. These markers help you correlate specific sections of the profile with the corresponding segments of the line on the map. For example, if your line follows a road with several waypoints, each marker shows where one segment ends and the next begins.

#### Hover Interaction

- Move the mouse over the chart to see a crosshair with the exact elevation and distance at that position
- A corresponding orange marker appears on the map, showing the geographic location of the hovered point
- Moving the mouse off the chart removes the marker

### Editing the Profile Line

#### Drawn Lines

Lines drawn with the Elevation Profile tool are immediately editable:

- **Move a vertex**: Click and drag an existing vertex
- **Add a vertex**: Click on a segment between vertices
- **Remove a vertex**: Alt-click (Option-click on macOS) on a vertex

The elevation profile recalculates automatically after each edit.

#### Selected Features

When the profile is based on a selected feature from the map, edits made to that feature through ODIN's standard modify tool are also reflected in the profile. The chart updates automatically when the geometry changes.

### Closing the Profile

Click the **X** button in the profile panel header. This also removes the line highlight and hover marker from the map.

## Tips

- The Elevation Profile button in the toolbar is only enabled when at least one terrain tile service is configured
- Disabling the last terrain source automatically closes any open elevation profile
- You can create multiple profiles in sequence — each new profile replaces the previous one
- For best results, use a terrain tile service that covers the area of your line
- Terrain tiles are cached in memory (up to 200 tiles), so revisiting the same area is fast
- The tool automatically uses the highest available zoom level of the terrain service, regardless of how far you are zoomed in on the map

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Elevation Profile is greyed out in the menu | No terrain tile service is configured. Add a tile service (XYZ, TileJSON, or TileJSON Discovery) and enable "RGB-encoded terrain data" |
| Profile chart is empty or shows gaps | The line extends beyond the terrain tile coverage area. Gaps indicate coordinates where no elevation data is available |
| No elevation shown at cursor position | Verify the terrain tile service is correctly configured and the server is accessible |
| Profile doesn't update after editing | Edits trigger a debounced recalculation (300ms delay). Wait briefly for the profile to refresh |

## Terrain Tile Sources

Any tile server providing Mapbox Terrain-RGB encoded tiles is compatible. Supported configurations:

- **Direct XYZ URL** — standard `{z}/{x}/{y}` tile endpoint
- **TileJSON endpoint** — a URL serving a [TileJSON](https://github.com/mapbox/tilejson-spec) document with a `tiles` array
- **TileJSON Discovery server** — a server like [mbtileserver](https://github.com/consbio/mbtileserver) that lists multiple tilesets; individual tilesets can be marked as terrain independently

In all cases, tiles must be served with CORS headers (`Access-Control-Allow-Origin`) enabled.
