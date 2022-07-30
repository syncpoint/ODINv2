import util from 'util'
import Emitter from '../../shared/emitter'

export function PreferencesProvider (windowManager, ipcMain) {
  Emitter.call(this)

  this.state = {}

  ipcMain.on('ipc:put:preferences', ({ sender }, tuples) => {
    const projectId = windowManager.handleFromId(sender.id)
    this.state[projectId] = Object.fromEntries(tuples)
    this.emit('preferencesChanged', { projectId, preferences: this.state[projectId] })
  })

  ipcMain.on('ipc:post:preferences', ({ sender }, key, value) => {
    const projectId = windowManager.handleFromId(sender.id)
    this.state[projectId] = this.state[projectId] || {}
    this.state[projectId][key] = value
    this.emit('preferencesChanged', { projectId, preferences: this.state[projectId] })
  })

  ipcMain.on('ipc:del:preferences', ({ sender }, key) => {
    const projectId = windowManager.handleFromId(sender.id)
    delete this.state[projectId][key]
    this.emit('preferencesChanged', { projectId, preferences: this.state[projectId] })
  })
}

PreferencesProvider.prototype.preferences = function (projectId) {
  return this.state[projectId] || {}
}

util.inherits(PreferencesProvider, Emitter)
