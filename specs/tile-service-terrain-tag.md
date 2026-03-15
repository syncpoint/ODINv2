# Tile Service Terrain Tag

## Overview

Tile services in ODIN can serve regular map imagery or RGB-encoded elevation
data (terrain). When a tile service is configured to provide terrain data, the
sidebar must display a **system tag** (`SYSTEM:TERRAIN::mdiTerrain`) so the user
can visually identify terrain services at a glance.

## Background

The terrain indicator was previously stored as a **user tag** via
`store.addTag(key, 'TERRAIN')`. The options function in `tile-service.js` then
filtered it out of the user tags and re-emitted it as a system tag — a
workaround that had two drawbacks:

1. Users could manually remove the tag, losing the terrain indicator.
2. The tag lived in two places (tag store + display logic), creating
   inconsistency risks.

## Current Behaviour

The terrain status is derived entirely from the service object. No dedicated
tag is written to the tag store.

### Terrain detection

A tile service is considered terrain when **either** condition is true:

| Condition | Typical service type | Description |
|-----------|---------------------|-------------|
| `service.terrain` array has entries | TileJSONDiscovery | Individual layers within a multi-layer discovery service are marked as terrain. |
| `service.capabilities.contentType === 'terrain/mapbox-rgb'` | XYZ, TileJSON | The entire service is designated as RGB-encoded elevation data. |

Both conditions are checked **regardless of service type**. A service type
alone never implies terrain.

### Tag rendering

The options function builds the tag string for the sidebar:

```
SCOPE:<type>:NONE [SYSTEM:TERRAIN::mdiTerrain] [USER:<label>:NONE ...] PLUS
```

- `SYSTEM:TERRAIN::mdiTerrain` — present only when the service is terrain.
  Displayed with the `mdiTerrain` icon. Not editable by the user.
- `USER:<label>:NONE` — regular user-assigned tags. Fully editable.
- `PLUS` — the "add tag" affordance.

### Terrain checkbox (Properties panel)

The `TileServiceProperties` component shows a checkbox labelled
*"RGB-encoded terrain data (elevation)"* for XYZ, TileJSON and
TileJSONDiscovery services. Toggling this checkbox:

- **TileJSONDiscovery**: adds/removes the selected layer id to/from
  `service.terrain`.
- **XYZ / TileJSON**: sets/clears `service.capabilities.contentType` to
  `'terrain/mapbox-rgb'`.

No tag store operations are performed — the system tag is derived on the
fly when the sidebar option is computed.

## Acceptance Criteria

1. A newly created XYZ tile service with `contentType: 'terrain/mapbox-rgb'`
   displays `SYSTEM:TERRAIN::mdiTerrain` (not a user tag).
2. A TileJSONDiscovery service with at least one entry in `service.terrain`
   displays `SYSTEM:TERRAIN::mdiTerrain`.
3. A TileJSONDiscovery service with an empty `service.terrain` array does
   **not** display the terrain tag.
4. A regular XYZ service (no terrain contentType) does **not** display the
   terrain tag.
5. User-assigned tags are rendered as `USER:<label>:NONE` and are never
   confused with the terrain system tag.
6. The terrain system tag cannot be removed via the tag editor.
