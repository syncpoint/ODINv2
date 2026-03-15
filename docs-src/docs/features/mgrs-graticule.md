# MGRS Graticule

ODIN provides a Military Grid Reference System (MGRS) coordinate grid overlay for the map. The grid is rendered as a vector layer and adapts its level of detail based on the current zoom level.

## Enabling the MGRS Grid

1. Open the **View** menu
2. Select **Graticules → MGRS**

The MGRS grid overlay appears on the map. WGS84 and MGRS graticules are mutually exclusive — enabling one disables the other.

## Grid Levels

The graticule renders three levels of detail based on the map resolution:

| Level | Grid Spacing | Visible When | Content |
|-------|-------------|--------------|---------|
| Grid Zone Designation (GZD) | 6° × 8° | Always | Zone boundaries and labels (e.g. `33U`) |
| 100 km Squares | 100 km | Resolution ≤ ~1200 m/px | Grid lines and two-letter square identifiers (e.g. `WP`) |
| 10 km Squares | 10 km | Resolution ≤ ~120 m/px | Fine grid lines with numeric labels |

## About MGRS

MGRS is based on the Universal Transverse Mercator (UTM) projection. UTM divides the world into 60 zones (each 6° wide) and lettered latitude bands (each 8° tall, from 80°S to 84°N). Within each zone, locations are identified by 100 km square letters and numeric easting/northing offsets.

### Example MGRS Coordinate

```
33U WP 12345 67890
```

- `33U` — Grid Zone Designation (zone 33, band U)
- `WP` — 100 km square identifier
- `12345 67890` — Easting and northing within the square (1 m precision)

## Styling

- **GZD boundaries** — Thicker stroke with zone labels at the centre of each visible zone
- **100 km grid lines** — Medium stroke with square letter labels
- **10 km grid lines** — Thin stroke with numeric labels
- All lines use a neutral colour to avoid interfering with map content

## Limitations

- UTM special zones (Norway, Svalbard) use standard 6° boundaries
- Polar regions (UPS) are not supported
- Grid levels finer than 10 km (1 km, 100 m) are not yet available
