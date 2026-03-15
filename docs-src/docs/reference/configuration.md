# Configuration

ODIN can be configured through environment variables.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ODIN_SELF_UPDATE` | `1` | Set to `0` to disable automatic update checks |
| `NOMINATIM_URL` | `https://nominatim.openstreetmap.org/search` | URL of the Nominatim server for place search. Set this when using a self-hosted Nominatim instance in offline environments. |

## Self-Hosted Search

If you operate ODIN without internet access, you can host your own [Nominatim](https://nominatim.org/release-docs/latest/admin/Installation/) server for the "Search for places" feature:

```bash
export NOMINATIM_URL=http://your-server:8080/search
```

## Self-Hosted Map Tiles

For offline map tiles, use [mbtileserver](https://github.com/consbio/mbtileserver):

1. Download `.mbtiles` files for your region
2. Start mbtileserver: `mbtileserver --dir /path/to/tiles`
3. Add the server URL in ODIN as a TileJSON Discovery service

See [Tile Services](../features/tile-services.md) for detailed instructions.
