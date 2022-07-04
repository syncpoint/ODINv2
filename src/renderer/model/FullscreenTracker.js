import util from 'util'
import Emitter from '../../shared/emitter'

export function FullscreenTracker (ipcRenderer) {
  ipcRenderer.on('IPC_ENTER_FULLSCREEN', () => this.changeFullscreen(true))
  ipcRenderer.on('IPC_LEAVE_FULLSCREEN', () => this.changeFullscreen(false))

  ;(async () => {
    const active = await ipcRenderer.invoke('ipc:get:fullscreen')
    this.changeFullscreen(active)
  })()
}

util.inherits(FullscreenTracker, Emitter)

FullscreenTracker.prototype.changeFullscreen = function (active) {
  this.active = active
  this.emit('FULLSCREEN_CHANGED', { active })
}

FullscreenTracker.prototype.isFullscreen = function () {
  return this.active || false
}
