# Real-Time Collaboration

ODIN supports real-time collaboration through the [Matrix](https://matrix.org) protocol. Multiple ODIN instances can share layers and synchronise changes in real time.

## How It Works

Collaboration in ODIN operates at the **layer level**. When you share a layer, it becomes available to other ODIN users connected to the same Matrix server. Changes to features within shared layers are replicated automatically.

Matrix is a federated, open protocol — you can use public Matrix servers or host your own for full control over your data.

## Sharing a Layer

1. Select the layer you want to share in the sidebar
2. Open the **Sharing** panel from the Properties Panel
3. Configure the Matrix server connection
4. Invite collaborators

## Permissions

Shared layers support different permission levels:

| Power Level | Access |
|------------|--------|
| 0 | Read-only access |
| 25 | Read and write (create/edit features) |
| 50 | Change layer name and settings |
| 100 | Full control (creator) |

A shared layer is **read-only by default**. Permissions for individual users can be changed at any time by the layer owner.

## Community

Join the ODIN community on Matrix: [#ODIN.Community:syncpoint.io](https://matrix.to/#/#ODIN.Community:syncpoint.io)
