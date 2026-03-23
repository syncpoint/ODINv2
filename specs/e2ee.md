# ODIN E2EE – End-to-End Encryption for Project Replication

## Overview

Add end-to-end encryption (E2EE) to ODIN's Matrix-based project replication. Encrypted rooms ensure that feature data exchanged between project participants cannot be read by the homeserver or unauthorized third parties.

## Scope

- **In scope:** E2EE for project rooms (feature data replication)
- **Out of scope:** PROJECT-LIST device (space management, invitations, permissions — no sensitive payload)

## Background

ODIN uses `@syncpoint/matrix-client-api` to replicate project data via Matrix rooms. Each project creates a dedicated Matrix device (`device_id: projectUUID`). The PROJECT-LIST uses `device_id: 'PROJECT-LIST'` for structural operations (sharing spaces, invitations).

Currently, all room communication is unencrypted. The Matrix homeserver can read all replicated feature data.

## Architecture

### Crypto SDK

**Package:** `@matrix-org/matrix-sdk-crypto-wasm` (already a dependency)

The Wasm bindings run natively in Electron's renderer process (Chromium), where IndexedDB is available as a persistent store. No package change required.

**Why not `matrix-sdk-crypto-nodejs`?**
The native Node.js bindings would require moving all crypto logic to the main process and proxying via IPC. This is a larger architectural change with no clear benefit, since the `MatrixClient` already lives in the renderer.

### Persistence

Each project gets its own IndexedDB-backed crypto store:

```
IndexedDB: 'crypto-<projectUUID>'
```

The `StoreHandle.open()` API creates and manages the IndexedDB database internally. The Wasm library controls the schema — there is no custom storage adapter needed.

### Passphrase Management

The IndexedDB crypto store is encrypted with a per-project passphrase.

**Flow:**

1. **Project is shared (first time):**
   - Generate a random passphrase: `crypto.randomBytes(32).toString('base64')`
   - Encrypt via Electron's `safeStorage.encryptString(passphrase)`
   - Store the encrypted passphrase in the project's LevelDB: `session` sublevel, key `crypto:passphrase`

2. **Project is opened:**
   - Read encrypted passphrase from LevelDB (`session['crypto:passphrase']`)
   - Decrypt via `safeStorage.decryptString(encryptedPassphrase)` (main process, exposed via preload/IPC)
   - Open crypto store: `StoreHandle.open('crypto-' + projectUUID, passphrase)`
   - Initialize OlmMachine: `OlmMachine.initFromStore(userId, deviceId, storeHandle)`

3. **Project is deleted:**
   - Delete the IndexedDB database `crypto-<projectUUID>` (via `indexedDB.deleteDatabase()`)
   - The LevelDB (including encrypted passphrase) is already deleted with the project directory

### IPC for safeStorage

`safeStorage` is a main-process-only API. The decrypted passphrase is passed to the renderer via the existing preload/IPC bridge. This is acceptable because:

- The passphrase protects the local IndexedDB store only
- An attacker with renderer access already has access to IndexedDB directly
- The passphrase never leaves the local machine

**Preload addition:**

```javascript
// preload: expose decryptPassphrase to renderer
replication: {
  decryptPassphrase: (encrypted) => ipcRenderer.invoke('replication:decrypt-passphrase', encrypted)
}
```

```javascript
// main process: handle decryption
ipcMain.handle('replication:decrypt-passphrase', (event, encrypted) => {
  return safeStorage.decryptString(Buffer.from(encrypted))
})
```

## Integration with matrix-client-api

### CryptoManager Changes

The existing `CryptoManager` in `matrix-client-api/src/crypto.mjs` needs to be updated:

1. **`initialize()` → `initializeWithStore()`**: Accept a `storePath` (IndexedDB name) and passphrase instead of creating an in-memory OlmMachine.

2. **Sync integration**: `receiveSyncChanges()` must be called with every `/sync` response to process to-device messages and update device tracking.

3. **Outgoing request processing**: After each sync cycle, `outgoingRequests()` must be polled and sent via HTTP (key uploads, key queries, key claims, to-device messages).

4. **Room encryption setup**: When a room has `m.room.encryption` state, call `setRoomEncryption()` to register it with the OlmMachine.

5. **Encrypt before send**: `command-api` messages must be encrypted via `encryptRoomEvent()` before sending.

6. **Decrypt on receive**: `timeline-api` must decrypt `m.room.encrypted` events via `decryptRoomEvent()`.

7. **Key sharing**: When a user joins a project room, room keys must be shared via `shareRoomKey()`.

### Enabling Encryption on Room Creation

**Default: E2EE enabled (secure by default, opt-out)**

When a project is shared, encryption is enabled by default. The user can explicitly opt out during the sharing dialog (e.g. a checkbox "Encrypt project data (recommended)" — checked by default).

The opt-out choice is stored in the project's LevelDB (`session['crypto:enabled']`):
- `true` (default) → rooms are created with encryption
- `false` (user opted out) → rooms are created without encryption

When E2EE is enabled, new project rooms (layers) are created with the `m.room.encryption` state event:

```javascript
{
  type: 'm.room.encryption',
  content: {
    algorithm: 'm.megolm.v1.aes-sha2'
  }
}
```

This is done in the `structure-api` when creating rooms for shared projects.

**Note:** Once a room is encrypted, it cannot be un-encrypted (Matrix protocol constraint). The opt-out decision applies at project-share time and affects all subsequently created rooms/layers.

## Data Flow

```
Project Open
    │
    ├─ Read encrypted passphrase from LevelDB
    ├─ Decrypt via safeStorage (IPC to main process)
    ├─ StoreHandle.open('crypto-<uuid>', passphrase)
    ├─ OlmMachine.initFromStore(userId, deviceId, storeHandle)
    ├─ Process outgoing requests (key upload)
    │
    ▼
Sync Loop
    │
    ├─ /sync response received
    ├─ receiveSyncChanges(toDevice, deviceLists, otkeyCounts, fallbackKeys)
    ├─ Process outgoing requests (key queries, claims, to-device)
    ├─ Decrypt m.room.encrypted events → pass to timeline-api
    │
    ▼
Send Message
    │
    ├─ shareRoomKey(roomId, userIds) if needed
    ├─ encryptRoomEvent(roomId, eventType, content)
    ├─ Send encrypted payload via command-api
    │
    ▼
Project Close
    │
    └─ OlmMachine is dropped, IndexedDB persists automatically
```

## Project Deletion Cleanup

When a project is deleted, the following must be cleaned up:

1. Project LevelDB directory (existing behavior)
2. IndexedDB database `crypto-<projectUUID>` (new: `indexedDB.deleteDatabase('crypto-' + projectUUID)`)

## Migration

Existing shared projects are unencrypted. Migration strategy:

- **New rooms** created after E2EE is enabled will have `m.room.encryption` state → encrypted
- **Existing rooms** remain unencrypted (no retroactive encryption possible in Matrix)
- The `timeline-api` must handle both encrypted and unencrypted events (check for `m.room.encrypted` type)
- Optional: provide a "re-share project" action that creates new encrypted rooms and migrates data

## Acceptance Criteria

1. New shared project rooms are created with `m.room.encryption` state event
2. Feature data sent to project rooms is encrypted (Megolm)
3. Feature data received from project rooms is decrypted transparently
4. Crypto keys persist across ODIN restarts (IndexedDB + passphrase in LevelDB)
5. `safeStorage` protects the passphrase at rest
6. Project deletion removes both LevelDB and IndexedDB crypto store
7. Existing unencrypted projects continue to work without modification
8. PROJECT-LIST remains unencrypted

## Design Decisions

### Key Verification

**Decision: TOFU (Trust on First Use) for V1.**

Devices are trusted on first contact. ODIN projects are typically shared within organizations where the homeserver is trusted. The existing `CryptoManager` already uses `TrustRequirement.Untrusted`, which is de facto TOFU.

Cross-signing and interactive verification (emoji comparison) can be added as a future enhancement.

### Key Backup

**Decision: Server-side key backup is required.**

ODIN uses delta-based replication: every change produces a separate message. There are no snapshots. When a new device joins a project room, it must **replay the entire message history** to reconstruct the local state. Without access to the Megolm session keys that encrypted those messages, the replay fails and the project is unusable.

Therefore, encrypted server-side key backup (`m.megolm_backup.v1.curve25519-aes-sha2`) must be implemented:

1. **Backup creation:** When the first E2EE project is shared, generate a backup key and store it encrypted (via `safeStorage`) in the master DB.
2. **Continuous backup:** After each Megolm session rotation, back up the new session keys to the homeserver.
3. **Key restore:** When a new device opens an existing encrypted project, download and decrypt the backed-up keys before starting the history replay.
4. **Recovery key:** Provide the user with a human-readable recovery key (e.g., base58-encoded) for disaster recovery. This can be shown once during setup and stored by the user.

**Note:** Without key backup, E2EE would effectively break project sharing for any new device — which contradicts the core use case.

### Megolm Session Rotation

**Decision: Use library defaults (100 messages or 1 week).**

ODIN produces many small state updates, so rotation will happen frequently. This is acceptable — the key-sharing overhead is minimal (one `m.room_key` to-device event per rotation per participant), and frequent rotation provides better forward secrecy. Can be tuned later if performance issues arise.

### Multi-Device and Message Filter

**Current limitation:** ODIN does not support the same user participating in the same project from multiple physical devices simultaneously. The timeline message filter excludes all events where the current user is the sender.

**Impact on E2EE:** The crypto layer uses to-device messages (`m.room.encrypted` to-device events) for key exchange. These are **not** room events and are not affected by the timeline filter. However, the following must be verified:

1. **To-device events** (key sharing, key requests) must **not** be filtered — they are processed in `receiveSyncChanges()` before the timeline filter runs.
2. **Room events from self** are currently filtered out. With E2EE, encrypted events from self (`m.room.encrypted` with own sender) must still be filtered the same way as unencrypted self-events — the filter should apply **after** decryption, based on the decrypted sender, not on the encrypted envelope.
3. If multi-device support is added later, the self-filter must be revisited: same user on a different device is a legitimate source of changes.

### Sync Filter Changes (matrix-client-api/src/project.mjs)

The Matrix sync filter is applied **server-side**, before events reach the client. With E2EE, the server only sees `m.room.encrypted` as the event type — not the original type (e.g. `io.syncpoint.odin.operation`). This means the current `types` filter would **drop all encrypted events**.

**Current filter (two locations):**

1. `content()` (history replay): `types: [ODINv2_MESSAGE_TYPE]`
2. `filterProvider()` (live sync): `types: [M_ROOM_NAME, M_ROOM_POWER_LEVELS, M_SPACE_CHILD, M_ROOM_MEMBER, ODINv2_MESSAGE_TYPE, ODINv2_EXTENSION_MESSAGE_TYPE]`

**Required change:** Add `m.room.encrypted` to the `types` array when E2EE is active:

```javascript
// In filterProvider():
const EVENT_TYPES = [
  M_ROOM_NAME,
  M_ROOM_POWER_LEVELS,
  M_SPACE_CHILD,
  M_ROOM_MEMBER,
  ODINv2_MESSAGE_TYPE,
  ODINv2_EXTENSION_MESSAGE_TYPE,
  'm.room.encrypted'  // NEW: let encrypted events through for client-side decryption
]

// In content():
types: [ODINv2_MESSAGE_TYPE, 'm.room.encrypted']
```

**Post-decryption filtering:** After decryption in the `timeline-api`, the original event type is restored. However, `m.room.encrypted` is a catch-all — it could contain any event type, including types not in the original filter list. Therefore, a **client-side type filter** must run after decryption to ensure only the expected event types are processed:

```javascript
// timeline-api.mjs, after decryption block:
// Re-apply type filter on decrypted events
if (filter?.types) {
  events[roomId] = roomEvents.filter(event => filter.types.includes(event.type))
}
```

**`not_senders` is unaffected:** The sender is event metadata (not encrypted), so the server-side `not_senders` filter continues to work correctly with encrypted events.

## Open Questions

1. **Snapshot mechanism:** A snapshot/checkpoint feature would reduce dependence on full history replay and make key backup less critical for day-to-day usage. Worth considering as a separate feature.
2. **Multi-device:** If same-user multi-device support is planned, the self-message filter and device key management need to be designed accordingly from the start.
