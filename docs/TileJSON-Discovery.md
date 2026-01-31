# Adding TileJSON Map Services

This guide explains how to add map tiles from a TileJSON server (like mbtileserver) to ODIN.

## What is TileJSON?

TileJSON is a format for describing map tile services. Servers like [mbtileserver](https://github.com/consbio/mbtileserver) can serve `.mbtiles` files and provide a list of available map layers that ODIN can discover and display.

## Step-by-Step Guide

### Step 1: Create a New Tile Service

1. Press `Ctrl+N` followed by `T` to create a new tile service
2. A new tile service appears in the sidebar and its properties panel opens

### Step 2: Enter the Server URL

1. In the **URL** field, enter the address of your TileJSON server
   - Example: `http://localhost:8000/services`
2. Press `Tab` or click outside the field to confirm

### Step 3: Select Map Layers

1. ODIN automatically detects the available tilesets and displays them as a list
2. Each tileset has a checkbox next to its name
3. Click the checkbox next to the tilesets you want to add

### Step 4: View in Background Maps

1. The selected tilesets now appear in the **Background Maps** control
2. To open Background Maps, click on the tile preset in the sidebar (or use `Ctrl+Shift+T`)
3. Here you can:
   - **Toggle visibility**: Click the eye icon to show/hide a map layer
   - **Adjust opacity**: Click the opacity icon and use the slider
   - **Change order**: Drag layers up or down to change their stacking order

## Tips

- You can select multiple tilesets from the same server
- New layers are hidden by default - click the eye icon to make them visible
- The zoom levels are automatically configured based on the tileset's settings

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No tilesets appear | Check that the server URL is correct and the server is running |
| Tiles don't load | Verify the server is accessible from your computer |
| Layer has no name | The server may not provide names - the tileset will still work |

## Example Setup with mbtileserver

1. Install mbtileserver: `go install github.com/consbio/mbtileserver@latest`
2. Place your `.mbtiles` files in a folder
3. Start the server: `mbtileserver --dir /path/to/tiles`
4. In ODIN, enter: `http://localhost:8000/services`
