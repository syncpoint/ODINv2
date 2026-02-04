# ODINv2 - Open Source Command and Control Information System (C2IS)

ODINv2 is the successor of [ODINv1](https://github.com/syncpoint/ODIN). ODIN has been completely rewritten and enables a wide range of new features such as layer-level links and styles, searchable `#tag`s for features, layers, symbols, etc.

## Online collaboration
Replication in a distributed command and control environment by making use of the [[matrix]](https://matrix.org) ecosystem is here. Make sure to join our [[matrix] ODIN Community Chat Room](https://matrix.to/#/#ODIN.Community:syncpoint.io) to get the latest news about ODIN.

![ODINv2 C2IS](assets/splash-01.jpeg?raw=true)

## NIDO - External Integration API

NIDO (ODIN reversed) is a WebSocket-based API that enables external applications to integrate with ODIN in real-time. This opens up powerful possibilities for extending ODIN's capabilities:

- **Digital Twin**: Mirror ODIN data in external systems for monitoring or backup
- **Automation**: Programmatically create, update, or delete features from scripts or external tools
- **System Integration**: Connect ODIN to other C2 systems, sensors, or data sources
- **Real-time Analytics**: Stream project data to external analytics or visualization tools

External applications can subscribe to live data changes, query project data, send commands to modify layers and features, and even control the map view. All coordinates are exposed in standard GeoJSON format (EPSG:4326 lon/lat).

To connect an external application, click the LAN icon in the ODIN toolbar and configure your WebSocket server URL.

For detailed protocol documentation and examples, see [docs/NIDO.md](docs/NIDO.md).

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
