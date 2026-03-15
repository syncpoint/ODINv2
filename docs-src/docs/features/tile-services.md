# Tile Services

Tile services provide background map imagery and elevation data for ODIN. You can configure multiple tile services and switch between them.

## Supported Service Types

| Type | Description |
|------|-------------|
| **XYZ** | Standard `{z}/{x}/{y}` tile URL |
| **TileJSON** | Single TileJSON endpoint |
| **TileJSON Discovery** | Server exposing multiple tilesets (e.g. [mbtileserver](https://github.com/consbio/mbtileserver)) |

## Adding a Tile Service

1. Press ++ctrl+n++ followed by ++t++ to create a new tile service
2. Enter the tile server URL in the **URL** field
3. Press ++tab++ or click outside the field to confirm

ODIN automatically detects the service type from the URL response.

## TileJSON Discovery

When using a TileJSON Discovery server:

1. ODIN detects the available tilesets and displays them as a list
2. Each tileset has a checkbox — enable the ones you want to use
3. Selected tilesets appear in the **Background Maps** control

This is ideal for self-hosted setups using [mbtileserver](https://github.com/consbio/mbtileserver) with `.mbtiles` files.

## Terrain Data

Tile services can provide RGB-encoded elevation data (Mapbox Terrain-RGB format) instead of visible map imagery. See [Elevation Data](elevation-data.md) for setup instructions.

When a tile service is configured as terrain, a system tag (`TERRAIN`) appears in the sidebar to visually distinguish it from regular map layers. This tag cannot be removed by the user.

## Self-Hosting Maps

For offline or air-gapped environments, you can host your own tile server:

1. Obtain `.mbtiles` files for your area of interest
2. Run [mbtileserver](https://github.com/consbio/mbtileserver) on your local machine or network
3. Add the server URL to ODIN as a TileJSON Discovery service

This gives you full operational independence without requiring an internet connection.
