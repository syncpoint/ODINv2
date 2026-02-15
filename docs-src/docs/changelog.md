# What's New

Release notes for ODIN. For the full changelog, see [GitHub Releases](https://github.com/syncpoint/ODINv2/releases).

---

## v3.2.0

### New Features

- **NIDO API** — A real-time WebSocket API that allows full control of ODIN and enhances its capabilities without changing its code. ([PR #75](https://github.com/syncpoint/ODINv2/pull/75))
- **Custom SVG Symbols** — Use the NIDO API to render custom SVG instead of SIDC-based symbols on the map. ([PR #77](https://github.com/syncpoint/ODINv2/pull/77))
- **Elevation Data** — Mapbox RGB-encoded terrain layers for real-time elevation display and elevation profiles along line geometries. ([PR #41](https://github.com/syncpoint/ODINv2/pull/41))
- **Shapes** — Draw non-military lines, polygons, and text annotations with custom styling. ([PR #84](https://github.com/syncpoint/ODINv2/pull/84))
- **Text Boxes** — Place text on the map with simplified markdown (headings, sub-headings, bullet points).
- **MGRS Graticule** — Military Grid Reference System overlay with support for special zones (Norway, Svalbard). ([PR #93](https://github.com/syncpoint/ODINv2/pull/93))
- **Map Quality Setting** — Adjust map rendering quality for different hardware capabilities. ([PR #92](https://github.com/syncpoint/ODINv2/pull/92))
- **Online Documentation** — Full MkDocs Material documentation at [odin.syncpoint.io/docs](https://odin.syncpoint.io/docs/). ([PR #95](https://github.com/syncpoint/ODINv2/pull/95))
- **Documentation** — German tutorial (Grundkonzepte) and shape/text documentation added.

### Fixes

- Avoid duplicate tags due to casing. ([PR #76](https://github.com/syncpoint/ODINv2/pull/76))
- Fix `File.path` removed in Electron 38 — dropped files had undefined paths.
- Default properties panel to open for new projects. ([PR #90](https://github.com/syncpoint/ODINv2/pull/90))
- Improved security following Electron best practices. ([PR #82](https://github.com/syncpoint/ODINv2/pull/82))

---

## v3.1.0

### New Features

- **Live Data Sources** — Real-time tracking via Server-Sent Events. ([PR #64](https://github.com/syncpoint/ODINv2/pull/64))
- **Circular Measure Tool** — Measure distances with a circular overlay. ([PR #66](https://github.com/syncpoint/ODINv2/pull/66))
- **GeoJSON Export** — Export layer data into GeoJSON files. ([PR #67](https://github.com/syncpoint/ODINv2/pull/67))
- **Tag List** — Faster access to tag filtering. ([PR #70](https://github.com/syncpoint/ODINv2/pull/70))
- **TileJSON Discovery** — Similar to WMS and WMTS tile service discovery. ([PR #71](https://github.com/syncpoint/ODINv2/pull/71))

### Improvements

- Persist and restore maximised/fullscreen window state. ([PR #68](https://github.com/syncpoint/ODINv2/pull/68))
- Improved tag handling. ([PR #73](https://github.com/syncpoint/ODINv2/pull/73))
- UI improvements in the sidebar. ([PR #65](https://github.com/syncpoint/ODINv2/pull/65))

---

## v3.0.2

Maintenance release — updated dependencies and internal improvements.

- Migrated SCSS to CSS.
- Moved unit tests to dedicated directory.
- Regression tests for luxon, fuse.js, rbush, proj4, geo-coordinate-parser, Color.
- Updated most outdated build/runtime dependencies.

---

## v3.0.1

Maintenance release.

---

## v3.0.0

Initial release of ODINv2 — a complete rewrite with Electron, OpenLayers, and Matrix-based collaboration.

---

For older releases, see the [GitHub Releases](https://github.com/syncpoint/ODINv2/releases) page.
