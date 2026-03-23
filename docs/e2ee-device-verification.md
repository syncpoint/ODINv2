# E2EE Device Verification – Proposal

## Problem

Currently ODIN uses TOFU (Trust on First Use) for device trust. This means any device claiming to be a project participant is trusted without verification. An attacker who compromises the homeserver or performs a MITM attack could inject a rogue device and intercept encrypted content.

For military/government use cases, this is insufficient. Users need to verify that they're communicating with the genuine devices of their collaborators.

## Matrix SAS Verification

Matrix specifies [Short Authentication String (SAS)](https://spec.matrix.org/v1.12/client-server-api/#short-authentication-string-sas-verification) verification, where two users compare a set of 7 emojis displayed on their screens. If the emojis match, the devices are mutually verified.

The `@matrix-org/matrix-sdk-crypto-wasm` SDK fully supports this:

- `VerificationRequest` — initiates/receives a verification flow
- `Sas` — the SAS verification state machine
- `Sas.emoji()` — returns 7 `Emoji` objects (symbol + description)
- `Sas.confirm()` — confirms match, sends `m.key.verification.done`
- `Sas.cancel()` — cancels if emojis don't match

## Proposed Flow for ODIN

### When: Verification happens at **project join** time

1. **Alice** shares an E2EE project with **Bob** (invite).
2. **Bob** accepts the invitation and joins.
3. ODIN detects Bob's new device (via `m.room.member` join + `device_lists.changed` in sync).
4. ODIN shows a **verification prompt** to Alice: _"Bob has joined. Verify Bob's device?"_
5. Alice initiates verification.
6. Both Alice and Bob see **7 emojis** in a modal dialog.
7. They compare emojis out-of-band (voice call, in person, secure messenger).
8. Both confirm → devices are marked as verified.

### Where in the UI

- **Verification prompt** appears in the project's sharing panel or as a notification bar at the top of the map view.
- **Emoji comparison dialog** is a modal overlay showing the 7 emojis in a grid, with "They match" and "They don't match" buttons.
- **Verification status** is shown per-member in the sharing properties panel (✅ verified / ⚠️ unverified).

### What changes if a device is unverified?

Two possible strategies:

**Option A: Warn but allow (recommended for V1)**
- Unverified devices get a ⚠️ warning in the sharing panel.
- All operations work normally.
- Users can verify at any time.
- Pragmatic for field use where verification might be deferred.

**Option B: Block until verified**
- Unverified devices cannot decrypt content.
- Keys are only shared with verified devices.
- More secure, but may break workflows if verification is delayed.

**Recommendation:** Start with Option A. The WASM SDK already has `TrustRequirement` settings that can switch behavior later.

## Implementation: matrix-client-api

### New CryptoManager Methods

```javascript
/**
 * Request verification of another user's device.
 * @param {string} userId
 * @returns {VerificationRequest} the request object to track the flow
 */
async requestVerification(userId)

/**
 * Accept an incoming verification request.
 * @param {string} userId
 * @param {string} flowId
 * @returns {VerificationRequest}
 */
async acceptVerification(userId, flowId)

/**
 * Start SAS verification on an accepted request.
 * @param {VerificationRequest} request
 * @returns {Sas} the SAS state machine
 */
async startSas(request)

/**
 * Get the 7 emojis for comparison.
 * @param {Sas} sas
 * @returns {Array<{symbol: string, description: string}>}
 */
getEmojis(sas)

/**
 * Confirm that emojis match.
 * @param {Sas} sas
 * @returns {OutgoingRequest[]} requests to send
 */
async confirmSas(sas)

/**
 * Cancel the verification.
 * @param {Sas} sas
 * @returns {OutgoingRequest|undefined}
 */
cancelSas(sas)

/**
 * Check if a user's device is verified.
 * @param {string} userId
 * @param {string} deviceId
 * @returns {boolean}
 */
async isDeviceVerified(userId, deviceId)

/**
 * Get verification status for all devices of a user.
 * @param {string} userId
 * @returns {Array<{deviceId: string, verified: boolean}>}
 */
async getDeviceVerificationStatus(userId)
```

### Verification Event Handling

The SAS flow uses `to_device` events:
- `m.key.verification.request`
- `m.key.verification.ready`
- `m.key.verification.start`
- `m.key.verification.accept`
- `m.key.verification.key`
- `m.key.verification.mac`
- `m.key.verification.done`
- `m.key.verification.cancel`

These are already routed through `receiveSyncChanges()` and handled by the OlmMachine internally. We need to:

1. **Detect incoming requests** — poll `getVerificationRequests(userId)` after sync.
2. **Surface them to ODIN** — emit events that ODIN can listen to (e.g., `verificationRequested`, `verificationReady`, `emojisAvailable`, `verificationDone`).
3. **Send outgoing requests** — `accept()`, `confirm()`, `cancel()` return `OutgoingRequest` objects that need to be sent via HTTP.

### Event Emission

Add verification events to the existing stream handler pattern:

```javascript
// In project.mjs or a new verification-handler.mjs
streamHandler.verificationRequested({ userId, flowId, request })
streamHandler.emojisAvailable({ userId, flowId, emojis })
streamHandler.verificationDone({ userId, deviceId })
streamHandler.verificationCancelled({ userId, flowId, reason })
```

## Implementation: ODIN (Electron)

### UI Components

1. **VerificationPrompt** — Notification bar or toast: _"New device detected for Bob. [Verify]"_
2. **EmojiComparisonDialog** — Modal showing 7 emojis in a grid with confirm/cancel buttons.
3. **MemberVerificationBadge** — ✅/⚠️ icon next to member names in sharing properties.

### Electron-specific

- The verification flow involves multiple async steps (request → accept → emojis → confirm).
- Use a React state machine or reducer to track the verification phase.
- Emojis are Unicode — no custom graphics needed.

## Protocol Sequence

```
    Alice                          Homeserver                         Bob
      │                                │                               │
      │  m.key.verification.request    │                               │
      ├───────────────────────────────►│  to_device                    │
      │                                ├──────────────────────────────►│
      │                                │                               │
      │                                │  m.key.verification.ready     │
      │  to_device                     │◄──────────────────────────────┤
      │◄───────────────────────────────┤                               │
      │                                │                               │
      │  m.key.verification.start      │                               │
      ├───────────────────────────────►│  to_device                    │
      │                                ├──────────────────────────────►│
      │                                │                               │
      │  m.key.verification.accept     │                               │
      │  to_device                     │◄──────────────────────────────┤
      │◄───────────────────────────────┤                               │
      │                                │                               │
      │  m.key.verification.key        │  (both exchange DH keys)      │
      │◄──────────────────────────────►│◄─────────────────────────────►│
      │                                │                               │
      │  ┌─────────────────────┐       │      ┌─────────────────────┐  │
      │  │  🐶 🔑 🎵 🌍 🎩 ☂️ 🌻 │       │      │ 🐶 🔑 🎵 🌍 🎩 ☂️ 🌻  │  │
      │  │  "Do these match?"  │       │      │ "Do these match?"   │  │
      │  └────────┬────────────┘       │      └────────┬────────────┘  │
      │           │ [Yes!]             │               │ [Yes!]        │
      │                                │                               │
      │  m.key.verification.mac        │  (both send MACs)             │
      │◄──────────────────────────────►│◄─────────────────────────────►│
      │                                │                               │
      │  m.key.verification.done       │                               │
      │◄──────────────────────────────►│◄─────────────────────────────►│
      │                                │                               │
      │  ✅ Bob's device verified      │         ✅ Alice verified     │
```

## Scope & Phases

### Phase 1 (minimal viable)
- CryptoManager methods for SAS verification
- Verification event emission in stream handler
- Basic ODIN UI: prompt + emoji dialog + status badge
- Manual verification (user clicks "Verify" in sharing properties)

### Phase 2 (polish)
- Auto-prompt on new device detection
- Verification status persists across restarts (already in OlmMachine store)
- Block key sharing to unverified devices (Option B)
- QR code verification as alternative to emoji

### Phase 3 (advanced)
- Cross-signing (verify user, not individual devices)
- Verification via room events (instead of to_device) for audit trail

## Open Questions

1. **When to block?** Should we ever refuse to share keys with unverified devices, or always warn-only?
2. **Verification UI location** — Modal? Side panel? Notification?
3. **Re-verification** — What happens when a user gets a new device? Auto-detect and re-prompt?
4. **Offline verification** — If Bob is offline when Alice initiates, the request waits. Timeout?
