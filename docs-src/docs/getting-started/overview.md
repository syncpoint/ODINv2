# Overview

ODIN is an open-source Command and Control Information System (C2IS) built for tactical mapping, situational awareness, and distributed coordination.

## Key Capabilities

| Capability | Description |
|-----------|-------------|
| **Military Symbology** | MIL-STD-2525C symbols with full modifier support |
| **Tactical Graphics** | Boundaries, areas, lines, and control measures |
| **Custom Shapes** | Lines, polygons, and text annotations with styling |
| **Collaboration** | Real-time layer sharing via the Matrix protocol |
| **Offline Operation** | Self-hosted map tiles, search, and elevation data |
| **Elevation Analysis** | RGB-encoded terrain tiles with elevation profiles |
| **External Integration** | NIDO WebSocket API and live SSE data sources |
| **MGRS Graticule** | Military Grid Reference System overlay |
| **Cross-Platform** | Windows, macOS, and Linux (Electron) |

## Architecture

ODIN is an Electron desktop application. Data is stored locally in each project and can optionally be replicated to other ODIN instances via Matrix servers.

```
┌─────────────────────────────────────────┐
│              ODIN Desktop               │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │   Map    │  │ Sidebar  │  │Toolbar│ │
│  │(OpenLayers)│ │(Layers/ │  │       │ │
│  │          │  │ Features)│  │       │ │
│  └────┬─────┘  └────┬─────┘  └───┬───┘ │
│       └──────┬───────┘            │     │
│              ▼                    │     │
│     ┌─────────────────┐          │     │
│     │   Project Store │◄─────────┘     │
│     └────────┬────────┘                │
│              │                         │
│    ┌─────────┼──────────┐              │
│    ▼         ▼          ▼              │
│ [Matrix]  [NIDO WS]  [SSE Live]       │
└─────────────────────────────────────────┘
```

- **Matrix** — Federated protocol for layer-level replication across instances
- **NIDO** — WebSocket API for full read/write access from external applications
- **SSE Live** — Server-Sent Events for real-time tracking data (read-only)

## Technology Stack

- **Runtime**: Electron (Node.js + Chromium)
- **Map Engine**: OpenLayers
- **Symbology**: MIL-STD-2525C renderer
- **Replication**: Matrix protocol
- **Persistence**: Local project files
- **Package**: Snap, AppImage, DMG, NSIS installer
