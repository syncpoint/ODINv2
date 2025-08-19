# ODINv2 - Open Source Command and Control Information System (C2IS)

ODINv2 is the successor of [ODINv1](https://github.com/syncpoint/ODIN). ODIN has been completely rewritten and enables a wide range of new features such as layer-level links and styles, searchable `#tag`s for features, layers, symbols, etc.

## Online collaboration
Replication in a distributed command and control environment by making use of the [[matrix]](https://matrix.org) ecosystem is here. Make sure to join our [[matrix] ODIN Community Chat Room](https://matrix.to/#/#ODIN.Community:syncpoint.io) to get the latest news about ODIN.

![ODINv2 C2IS](assets/splash-01.jpeg?raw=true)

## Migration from ODINv1

ODINv2 will migrate all of your existing ODINv1 projects on first start. You will be able to further use ODINv1 in parallel but we will not update newly or updated projects after the first start of ODINv2. If you do have any 
ODINv1 layer files (*.json) you can import them at any time via drag&drop onto the ODINv2 map.

## Configuration via environment

### Self-Update

Self-Update is enabled by default and ODIN will check for newer versions. In order to disable Self-Update
one can use the environment variable `ODIN_SELF_UPDATE` with a value of `0`.

## License

Copyright (c) Syncpoint GmbH. All rights reserved.

Licensed under the [GNU Affero GPL v3](LICENSE.md) License.

When using the ODIN or other GitHub logos, be sure to follow the [GitHub logo guidelines](https://github.com/logos).

## Performance

Recent updates improve rendering performance on large maps by caching symbol style modifiers and reusing style instances. Style updates are throttled using a circuit breaker to avoid excessive recomputation when text visibility is toggled rapidly.
