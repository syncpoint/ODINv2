# MGRS Graticule

## Overview

Add an MGRS (Military Grid Reference System) coordinate grid overlay to the
map. The grid is rendered as a vector layer and adapts its level of detail
based on the current zoom level. The minimum supported resolution is 10 × 10 km
grid squares.

## Background

ODIN already supports a WGS84 (latitude/longitude) graticule via the OpenLayers
`Graticule` class. The View → Graticules menu contains an `MGRS (not
implemented)` entry that sends the `VIEW_GRATICULE` event with type `'MGRS'`.
The renderer-side `graticules.js` currently only handles the `'WGS84'` case.

MGRS is based on the UTM (Universal Transverse Mercator) projection. UTM
divides the world into 60 zones (each 6° wide) and lettered latitude bands
(each 8° tall, from 80°S to 84°N). Within each zone, locations are identified
by 100 km square letters and numeric easting/northing offsets.

## Grid Levels

The graticule renders three levels of detail, shown based on map resolution:

| Level | Grid spacing | Shown when | Content |
|-------|-------------|------------|---------|
| Grid Zone Designation (GZD) | 6° × 8° | Always | Zone boundaries + zone labels (e.g. `33U`) |
| 100 km squares | 100 km | Resolution ≤ ~1200 m/px | 100 km grid lines + square letters (e.g. `WP`) |
| 10 km squares | 10 km | Resolution ≤ ~120 m/px | 10 km grid lines + numeric labels |

## Technical Approach

- Implement as a new module `src/renderer/components/map/mgrsGraticule.js`.
- Use `ol/layer/Vector` + `ol/source/Vector` with `Feature`/`LineString`
  geometries.
- Use `geodesy/mgrs.js` (already in the project) for UTM ↔ Lat/Lon
  conversions.
- Compute grid lines only for UTM zones visible in the current map extent.
- Interpolate each grid line with multiple points (UTM → WGS84 → EPSG:3857)
  to account for line curvature in the Web Mercator projection.
- Recalculate features on `moveend` events.
- Extend `graticules.js` to handle the `'MGRS'` type.
- Update the menu label from `'MGRS (not implemented)'` to `'MGRS'`.

## Styling

- **GZD boundaries**: thicker stroke, zone label at the center of each visible
  zone.
- **100 km grid lines**: medium stroke, 100 km square letter labels.
- **10 km grid lines**: thin stroke, numeric labels.
- All lines use a neutral colour (e.g. dark grey with partial transparency) to
  avoid interfering with map content.

## Scope Limitations (first iteration)

- UTM special zones (Norway 31V/32V, Svalbard 31X–37X) are handled with
  standard 6° boundaries. Irregular boundaries are a follow-up.
- Polar regions (UPS) are out of scope.
- Grid levels finer than 10 km (1 km, 100 m) are out of scope but the
  architecture should allow adding them later.

## Acceptance Criteria

1. Selecting View → Graticules → MGRS enables the MGRS grid overlay.
2. Deselecting the menu item removes the overlay.
3. WGS84 and MGRS graticules are mutually exclusive (enabling one disables
   the other, matching existing radio-like behaviour).
4. At low zoom levels, UTM Grid Zone Designations (e.g. `33U`) are visible
   with their boundaries.
5. At medium zoom levels, 100 km square boundaries appear with their two-letter
   identifiers.
6. At high zoom levels, 10 km grid lines appear within the 100 km squares.
7. Grid lines are only computed for zones visible in the current viewport.
8. Labels are readable and do not overlap excessively.
9. The grid adapts when the user pans or zooms.
10. Performance is acceptable — no visible lag when panning at any zoom level.
