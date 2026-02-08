const { ipcRenderer } = require('electron')

module.exports = {
  getStreamToken: (id) => ipcRenderer.invoke('ipc:get:replication/streamToken', id),
  putStreamToken: (id, streamToken) => ipcRenderer.invoke('ipc:put:replication/streamToken', id, streamToken),
  getCredentials: (id) => ipcRenderer.invoke('ipc:get:replication/credentials', id),
  putCredentials: (id, credentials) => ipcRenderer.invoke('ipc:put:replication/credentials', id, credentials),
  delCredentials: (id) => ipcRenderer.invoke('ipc:del:replication/credentials', id),
  putReplicationSeed: (id, seed) => ipcRenderer.invoke('ipc:put:project:replication/seed', id, seed)
}
