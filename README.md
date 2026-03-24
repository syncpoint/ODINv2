# ODINv2 - Open Source Command and Control Information System (C2IS)

ODINv2 is the successor of [ODINv1](https://github.com/syncpoint/ODIN). ODIN has been completely rewritten and enables a wide range of new features such as layer-level links and styles, searchable `#tag`s for features, layers, symbols, etc.

[![Get it from the Snap Store](https://snapcraft.io/en/light/install.svg)](https://snapcraft.io/odin-v2)

![ODINv2 C2IS](assets/ODIN-Splash-3.2.0.jpg?raw=true)

## Real-Time Collaboration via Matrix

ODIN uses the [Matrix](https://matrix.org) protocol for real-time collaboration in distributed command and control environments. Matrix is an open, federated communication standard — the same technology used by NATO, the German Bundeswehr, and the French government for secure messaging.

### Why Matrix?

- **Federation** — Each organisation can run its own server while still collaborating with partners. No single point of failure, no central authority.
- **Open Standard** — No vendor lock-in. Your data stays yours. Switch servers, self-host, or use a managed service — ODIN works with any Matrix-compatible server.
- **Battle-Tested Infrastructure** — Leverage existing server implementations like [Synapse](https://github.com/element-hq/synapse) or [Tuwunel](https://github.com/matrix-construct/tuwunel) instead of building and maintaining a custom sync protocol.
- **Offline-First** — Full sync on reconnect. Work offline, and ODIN catches up automatically when connectivity is restored.

### End-to-End Encryption (E2EE)

All collaboration data in ODIN can be **end-to-end encrypted by default**. This means:

- **Only participants can read the data.** Not the server operator, not the network provider, not even Syncpoint. The encryption keys never leave the devices.
- **Megolm/Olm cryptography** — the same proven, audited crypto stack used by Signal and Element. AES-256 for message encryption, Ed25519 for device verification.
- **Historical Key Sharing** — When a new member joins a project, existing participants securely share historical encryption keys via Olm-encrypted channels. New members get full access to existing data without compromising security.
- **SAS Emoji Verification** — Verify device identity through emoji comparison to prevent man-in-the-middle attacks.
- **Per-project control** — Enable or disable encryption when sharing a project. Once enabled, it cannot be downgraded.

#### Forward Secrecy Trade-Off

Standard Matrix E2EE provides **Perfect Forward Secrecy (PFS)**: members who join a room cannot decrypt messages sent before their join. This is ideal for messaging, but incompatible with collaborative map editing — a new team member joining an operation must see the complete operational picture, not just changes made after their arrival.

ODIN deliberately trades PFS for **full data availability**: when a layer is shared, the encryption keys for existing content are proactively distributed to all project members. When new members join later, keys are shared automatically — even if the sharing member is offline at that point (keys are queued server-side for delivery).

This means: anyone with access to a project's layer can decrypt its entire history. This is a conscious design decision — ODIN is a C2IS, not a messenger. Operational data must be complete and consistent for all authorized participants.

> **Known limitation:** After Megolm key rotation (triggered by message count, time, or membership changes), keys for the new session are shared with current layer members automatically during encryption. Members who join after a rotation receive older keys at share time and newer keys via the safety-net mechanism when an online member detects their join. In the rare case where no existing member is online during the join, post-rotation content may be temporarily undecryptable until an existing member comes online.

E2EE makes ODIN suitable for handling classified and sensitive operational data in environments where data sovereignty and confidentiality are non-negotiable.

### Member Management

Project owners and administrators can manage team membership directly from ODIN:

- Invite new members by searching the Matrix user directory
- Assign roles (Owner, Administrator, Contributor) with different permission levels
- Remove members from projects
- All role changes are enforced server-side through Matrix power levels

Make sure to join our [Matrix ODIN Community Chat Room](https://matrix.to/#/#ODIN.Community:syncpoint.io) to get the latest news about ODIN.

## Elevation Data and Terrain Analysis

ODINv2 supports RGB-encoded terrain tiles (Mapbox Terrain-RGB) for elevation data. Terrain sources can be configured from XYZ tile URLs, TileJSON endpoints, or TileJSON Discovery servers (e.g. mbtileserver) — where individual discovered tilesets can be independently marked as terrain. When configured, ODIN displays live elevation at the cursor position and provides an **Elevation Profile** tool that charts elevation vs. distance along any line — whether drawn on-the-fly or from an existing feature. Drawn profile lines are fully editable, and the chart updates automatically as the geometry changes. The tool works independently of the current viewport, sampling elevation data directly from terrain tiles.

For setup instructions and usage details, see [docs/elevation-data.md](docs/elevation-data.md).

## NIDO - External Integration API

NIDO (ODIN reversed) is a WebSocket-based API that enables external applications to integrate with ODIN in real-time. This opens up powerful possibilities for extending ODIN's capabilities:

- **Digital Twin**: Mirror ODIN data in external systems for monitoring or backup
- **Automation**: Programmatically create, update, or delete features from scripts or external tools
- **System Integration**: Connect ODIN to other C2 systems, sensors, or data sources
- **Real-time Analytics**: Stream project data to external analytics or visualization tools

External applications can subscribe to live data changes, query project data, send commands to modify layers and features, and even control the map view. All coordinates are exposed in standard GeoJSON format (EPSG:4326 lon/lat).

To connect an external application, click the LAN icon in the ODIN toolbar and configure your WebSocket server URL.

For detailed protocol documentation and examples, see [docs/NIDO.md](docs/NIDO.md).

### NIDO vs. Live Data Sources

ODIN supports two different mechanisms for external data integration:

| | NIDO | Live Data Sources |
|---|---|---|
| **Connections** | Single connection only | Multiple sources allowed |
| **Data persistence** | Full persistence (stored in project) | Not persisted (disappears on disconnect) |
| **Feature properties** | Full access to all properties | Properties not available |
| **Control** | Full read/write access to all project data | Read-only display on map |
| **Security** | Use only with trusted servers | Suitable for untrusted/public sources |

**NIDO** provides complete control over your project and should only be used with servers you fully trust. **Live Data Sources** are ideal for displaying real-time tracking data from external systems without affecting your project's stored data.

## Migration from ODINv1

ODINv2 will migrate all of your existing ODINv1 projects on first start. You will be able to further use ODINv1 in parallel but we will not update newly or updated projects after the first start of ODINv2. If you do have any 
ODINv1 layer files (*.json) you can import them at any time via drag&drop onto the ODINv2 map.

## Configuration via environment

### Self-Update

Self-Update is enabled by default and ODIN will check for newer versions. In order to disable Self-Update
one can use the environment variable `ODIN_SELF_UPDATE` with a value of `0`.

### OpenStreetMap Nominatim

If you are not connected to the Internet and you want to use the "Search for places" function you need to host your own OSM [Nominatim server](https://nominatim.org/release-docs/latest/admin/Installation/). In order
to make ODIN use your on-premise instance of Nominatim you cat use the environment variable `NOMINATIM_URL`. The default value for this parameter is `https://nominatim.openstreetmap.org/search`.

## Host your own map server

You are an offline-first user and want to host your own map server (i.e. on your laptop)? GeoWebServer is way to big and uses too many resources? Just fire up [mbtileserver](https://github.com/consbio/mbtileserver), provide a _mbtile_ file that contains all your map tiles and you are done.

## License

Copyright (c) Syncpoint GmbH. All rights reserved.

Licensed under the [GNU Affero GPL v3](LICENSE.md) License.

When using the ODIN or other GitHub logos, be sure to follow the [GitHub logo guidelines](https://github.com/logos).
