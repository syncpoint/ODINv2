# Implementation plan: migrate `leveldown` → `abstract-level` family

## Goal

Replace the legacy Level stack (`leveldown`, `levelup`, `memdown`,
`subleveldown`, `encoding-down`, `abstract-leveldown`, `deferred-leveldown`)
with the actively maintained `abstract-level` family. The on-disk LevelDB
format is unchanged, so **no data migration is required** — `classic-level`
opens existing `leveldown` databases.

## Package changes

- **Remove:** `leveldown`, `levelup`, `memdown`, `subleveldown`,
  `encoding-down`, `abstract-leveldown`, `deferred-leveldown`
- **Add:** `classic-level` (native, N-API), `memory-level`, `abstract-level`

## Guiding principle

Keep the exported `L.*` helper API in `src/shared/level/index.js`
**unchanged**. Then the ~21 consumer files stay untouched and the migration
is confined to 6 files.

## API differences to handle

| Old | New |
|---|---|
| `levelup(encode(leveldown(loc), enc))` | `new ClassicLevel(loc, { valueEncoding })` |
| `subleveldown(db, name, enc)` | `db.sublevel(name, { valueEncoding })` |
| `db.get(k)` throws `NotFound` | `db.get(k)` returns `undefined` |
| `db.createReadStream(opts)` | `db.iterator(opts)` / `db.keys()` / `db.values()` (async-iterable) |
| `AbstractLevelDOWN` / `AbstractIterator` (callback) | `AbstractLevel` / `AbstractIterator` (promise-based) |
| `getMany`, `batch`, range options (`gte/lte/limit/reverse`) | unchanged |

## Phases

### Phase 0 — Branch & preparation
- Branch `chore/level-migration`.
- Install the new packages *alongside* the old ones, so the migration can
  proceed file by file with tests staying green.

### Phase 1 — `wkb.js`
- Port the WKB encoding to the `abstract-level` custom-encoding shape
  (`{ encode, decode, format }`, via `level-transcoder`). Open question:
  current `format` (`'buffer'` vs `'view'`).
- Adapt `test/shared/level/wkb-test.js`, keep green.

### Phase 2 — `index.js` (factory + helpers)
- New `leveldb()` factory: `classic-level` / `memory-level` instead of the
  `levelup`/`encode`/`leveldown` nesting; `sublevel` branches → `db.sublevel()`.
- Rewrite the stream readers (`read`, `Streams`, `readStream`,
  `readTuples/Keys/Values`, `existsKey`) on async iterators.
- `get()` helper: check for `undefined` instead of `try/catch` on `NotFound`.
- **Keep the exported signatures identical.**

### Phase 3 — `PartitionDOWN.js` (core piece)
- Reimplement as an `AbstractLevel` subclass delegating to two child DBs
  (JSON + WKB).
- Private methods on the promise contract:
  `_open/_close/_get/_getMany/_put/_del/_batch/_iterator`.
- Custom iterator: port the two-iterator synchronisation logic to the new
  `_next() → [key, value]` model.
- Adapt `test/shared/level/PartitionDOWN-test.js`, keep green.

### Phase 4 — `ipc.js` (renderer↔main bridge)
- `IPCDownClient` → `AbstractLevel` subclass; `IPCIterator` → new
  `AbstractIterator`.
- `IPCServer`: replace `db.createReadStream` in the `ITERATOR` handler with
  `db.iterator()`.
- Option considered but **not recommended**: `many-level` instead of the
  hand-rolled bridge — would need an IPC↔duplex-stream adapter, more moving
  parts.
- Adapt `test/shared/level/ipc-test.js`, keep green.

### Phase 5 — direct imports
- `src/renderer/components/ProjectList-services.js`
  (`levelup`/`memdown`/`subleveldown`).
- `src/main/legacy/transfer.js`, `src/main/preload/preload.js`.

### Phase 6 — cleanup
- Remove the old packages from `package.json`, `npm install`, verify the
  lockfile.

### Phase 7 — verification
- `npm run lint`, `npm test` (especially `test/shared/level/*`,
  `test/renderer/store/schema/`, `test/main/stores/`).
- Manual (clean build): open/create/save a project, features with geometry
  (the PartitionDOWN path), schema upgrade, replication, legacy transfer.

## Risks

- **Storage core** — data-path bugs are severe; the tests are the safety
  net (present for all three `shared/level` files).
- **PartitionDOWN iterator** — the two-iterator synchronisation is the
  trickiest part.
- **IPC iterator** — currently fetches the whole result at once; keep that
  behaviour deliberately, or deliberately switch to real streaming (record
  the decision).

## Effort

~1–1.5 days of focused work including tests.
