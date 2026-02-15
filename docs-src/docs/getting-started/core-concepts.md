# Core Concepts

This page introduces the fundamental concepts in ODIN.

## Projects

A **project** is the top-level container for all your work. Each project is stored locally and contains layers, features, tile services, bookmarks, and settings. You can have multiple projects and switch between them.

## Layers

**Layers** are the primary organisational unit. Each layer is a container that groups features (symbols, graphics, shapes) on the map.

- **Thematic separation** — Create layers for friendly forces, hostile forces, logistics, boundaries, etc.
- **Visibility** — Toggle layers on and off to control what is shown on the map
- **Locking** — Lock a layer to prevent accidental edits
- **Sharing** — Share individual layers with other ODIN users via Matrix

## Features

A **feature** is any object placed on the map. Features belong to a layer and have:

- **Geometry** — The geographic shape (point, line, polygon)
- **Properties** — Attributes such as the symbol code (SIDC), name, and designator
- **Style** — Visual appearance (colours, line width, fill)
- **Tags** — Searchable labels for filtering and organisation

### Feature Types

| Type | Description |
|------|-------------|
| Military symbols | MIL-STD-2525C point symbols (units, equipment, installations) |
| Tactical graphics | Standardised lines and areas (boundaries, phase lines, assembly areas) |
| Shapes | Custom lines, polygons, and text labels |
| Markers | Simple point markers |

## Tags

**Tags** are free-form labels that can be attached to layers and features. Use them to categorise and filter your data. Tags are searchable from the sidebar.

Examples: `#PRIORITY`, `#PHASE-1`, `#LOGISTICS`, `#ARTILLERY`

## Tile Services

**Tile services** provide background map imagery. ODIN supports:

- **XYZ** — Standard `{z}/{x}/{y}` tile URLs
- **TileJSON** — Single TileJSON endpoints
- **TileJSON Discovery** — Servers like [mbtileserver](https://github.com/consbio/mbtileserver) that expose multiple tilesets

Tile services can also provide RGB-encoded elevation data for terrain analysis.

## Bookmarks

**Bookmarks** save map view positions (centre, zoom, rotation) for quick navigation. Use them to jump between areas of interest on the map.

## Links

**Links** attach external resources to layers or features. They can point to URLs or local files, allowing you to reference documents, briefings, or web resources directly from the map.
