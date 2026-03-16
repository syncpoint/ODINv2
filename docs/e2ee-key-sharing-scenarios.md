# E2EE Key Sharing Scenarios

This document describes the key sharing scenarios for ODIN's end-to-end encrypted collaboration. It covers when and how Megolm session keys must be distributed to ensure all participants can decrypt layer content.

## Background

ODIN uses Matrix E2EE (Megolm) for encrypted layers. Each encrypted message is encrypted with a Megolm session key. To decrypt, a participant needs the corresponding session key. Keys are distributed via `to_device` messages (encrypted per-device with Olm).

**Critical constraint:** ODIN replays all events in a layer when a user joins ("catch-up"). Without the Megolm session keys for historical events, the replay fails and the layer appears empty or broken.

---

## Scenarios

### 1. Alice creates an encrypted layer and shares it with Bob

**Precondition:** Alice creates a layer with content, then shares it (Bob gets invited to the layer room).

**Flow:**
1. Alice creates layer, adds content (features on the map).
2. Each `io.syncpoint.odin.operation` is encrypted with a Megolm session. Keys are shared with current room members (only Alice at this point).
3. Alice invites Bob to the layer.
4. **At invite time, Alice MUST share all existing Megolm session keys with Bob** via `to_device`. Alice is guaranteed to be online (she initiated the invite).
5. Bob accepts the invitation.
6. Bob performs the replay (catches up on all events). He can decrypt because he received the keys at step 4.

**Status:** ❌ Not implemented. Currently, keys are only shared when sending a new message (`command-api.mjs`), not at invite time.

**Required fix:** When inviting a user to an encrypted room, proactively share all Megolm session keys for that room with the invited user.

---

### 2. Alice shares an empty layer, Bob joins, then Alice adds content

**Precondition:** Layer has no content when Bob joins.

**Flow:**
1. Alice creates and shares an empty layer, invites Bob.
2. Bob accepts.
3. Alice adds content. The Megolm session key is shared with all room members (Alice + Bob) at send time.
4. Bob receives the events and can decrypt.

**Status:** ✅ Works. `command-api.mjs` already shares keys with all joined members when sending.

---

### 3. Bob joins a layer that already has content from multiple participants

**Precondition:** Alice and Carol have both contributed encrypted content. Bob is invited later.

**Flow:**
1. Alice and Carol add content to the layer over time. Multiple Megolm sessions may exist (sessions rotate periodically).
2. Alice invites Bob.
3. **Alice must share ALL Megolm session keys she holds for this room** — including sessions originally created by Carol (Alice received Carol's keys when Carol sent messages).
4. Bob accepts and replays. He can decrypt all historical content.

**Status:** ❌ Not implemented.

**Note:** The inviting user shares keys they possess. If Alice somehow doesn't have Carol's keys (e.g., Alice joined after Carol left), those events remain undecryptable for Bob. This is an edge case; in practice, all active participants hold all session keys for events they've received.

---

### 4. Real-time collaboration (steady state)

**Precondition:** All participants have joined. Content is added in real-time.

**Flow:**
1. Any participant sends an operation.
2. `command-api.mjs` shares the Megolm session key with all room members before encrypting.
3. All participants receive the key via `to_device` and can decrypt.

**Status:** ✅ Works.

---

### 5. Role change: Alice demotes Bob to READER, then promotes back to CONTRIBUTOR

**Precondition:** Bob was CONTRIBUTOR, gets demoted to READER, then promoted again.

**Flow:**
1. Alice changes Bob's power level to READER.
2. Bob's ODIN instance detects `m.room.power_levels` change → layer is restricted (locked).
3. Bob cannot add content (UI enforces restriction).
4. Alice promotes Bob back to CONTRIBUTOR.
5. Bob's layer is unlocked.
6. Bob can add content again. New Megolm session keys are shared normally.

**Status:** ⚠️ Partially works. Role changes propagate but the layer restriction/locking needs verification with Tuwunel (see power_levels state event delivery issue).

**Note:** Demotion to READER does not require key revocation — Bob can still decrypt existing content, he just can't write. Megolm doesn't support key revocation; a new session is created when membership changes.

---

### 6. Events between invite and join

**Precondition:** Alice invites Bob. Before Bob accepts, Alice (or Carol) sends new content.

**Flow:**
1. Alice invites Bob and shares existing keys (Scenario 1).
2. Alice sends new content. Key is shared with all room members — but Bob hasn't joined yet, so he may not be in the member list.
3. Bob accepts the invite and replays.

**Status:** ❌ Potential gap. Events sent between invite and join may use a new Megolm session that wasn't shared with Bob.

**Required fix:** After Bob joins, either:
- Alice detects `m.room.member` join event and re-shares all session keys, OR
- Bob sends a key request (`m.room_key_request`) for any sessions he can't decrypt.

**Recommended approach:** Combine both — proactive share on invite + reactive share on join for any gaps.

---

### 7. Participant goes offline and comes back

**Precondition:** Bob is offline while Alice sends content.

**Flow:**
1. Bob goes offline.
2. Alice sends content. Key sharing via `to_device` is queued server-side.
3. Bob comes back online, syncs, receives `to_device` messages with keys.
4. Bob receives the encrypted events and can decrypt.

**Status:** ✅ Works (Matrix handles `to_device` delivery when recipient comes online).

---

### 8. New device / fresh user-data-dir

**Precondition:** Bob opens the project on a new device (or with `--user-data-dir=/tmp/bob2`).

**Flow:**
1. Bob's new device has no Megolm session keys.
2. Bob syncs and tries to replay layer content → fails, no keys.
3. Bob needs to obtain keys from somewhere.

**Options:**
- **Server-side Key Backup:** Bob's keys are backed up encrypted. New device restores from backup. Only works for Bob's **own** keys, not keys from other sessions he received.
- **Key forwarding:** Bob's old device (if still active) forwards keys to the new device.
- **Re-share from peers:** Other room members re-share keys when they see Bob's new device.

**Status:** ❌ Not implemented. This is a future concern (single-device model for now).

---

## Implementation Priority

| Priority | Scenario | Action |
|----------|----------|--------|
| **P0** | #1, #3 | Share all room session keys on invite |
| **P0** | #6 | Re-share keys on member join (catch gaps) |
| **P1** | #5 | Verify role changes work with Tuwunel |
| **P2** | #8 | Key backup / multi-device (future) |

## Key Sharing Implementation Notes

### Where to implement key share on invite

The invite happens in `structure-api.mjs` → `invite()` which just calls `httpAPI.invite()`. After a successful invite, we need to:

1. Get all Megolm session keys for the room from `CryptoManager` / `OlmMachine`
2. Export the session keys (via `OlmMachine.exportRoomKeys()` or equivalent)
3. Encrypt them for the invited user's devices (Olm)
4. Send via `to_device`

The `OlmMachine.shareRoomKey()` in `crypto.mjs` already handles the Olm encryption and `to_device` sending. The question is whether it shares **all** historical session keys or only the current session.

### Matrix SDK Crypto WASM API

- `shareRoomKey(roomId, userIds)` — shares the **current** Megolm session. May NOT include historical sessions.
- `exportRoomKeys()` — exports all session keys (for backup). Could be used to get historical keys, but they'd need to be re-imported on the recipient side via a custom mechanism.
- **Alternative:** Check if `shareRoomKey` with a freshly tracked user triggers sharing of all known sessions for that room.

### Testing

Each scenario above should have a corresponding integration test in `test-e2e/`. Tests should run against Tuwunel (Docker) with two users (Alice, Bob) and verify:
- Events can be decrypted after the described flow
- Layer content replay works completely
- No `Failed to decrypt` errors in the log
