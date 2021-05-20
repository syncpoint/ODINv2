import { app } from 'electron'

/**
 * @typedef {Object} SessionOptions
 * @property {SessionStore} [sessionStore]
 * @property {ProjectStore} [projectStore]
 * @property {WindowManager} [windowManager]
 * @property {Emitter} [evented]
 */

/**
 * @param {SessionOptions} options
 * @constructor
 */
export function Session (options) {
  this.windowManager = options.windowManager
  this.sessionStore = options.sessionStore
  this.projectStore = options.projectStore
  this.evented = options.evented

  // Emitted before the application starts closing its windows.
  this._quitting = false
  app.once('before-quit', () => {
    this._quitting = true
  })
}

Session.prototype.restore = async function () {
  const projects = await this.sessionStore.getProjects()

  if (projects.length) {
    await Promise.all(projects.map(key => this.openProject(key)))
  } else {
    const window = await this.windowManager.showSplash()
    window.show()
  }
}

Session.prototype.openProject = async function (key) {

  if (this.windowManager.isWindowOpen(key)) {
    return this.windowManager.focusWindow(key)
  }

  // TODO: update project lastAccess to now

  const project = await this.projectStore.getProject(key)
  const window = await this.windowManager.showProject(key, project)
  await this.sessionStore.addRecent(key, project.name)

  // TODO: refresh application menu
  this.evented.emit('command/menu/refresh')

  ;['resized', 'moved'].forEach(event => window.on(event, () => {
    this.projectStore.updateWindowBounds(key, window.getBounds())
  }))

  if (this.windowManager.isWindowOpen('splash')) {
    this.windowManager.closeWindow('splash')
  }

  await this.sessionStore.addProject(key)
  window.show()
}

Session.prototype.createProject = function () {
  console.log('[Session] createProject')
}

Session.prototype.windowClosed = async function (key) {

  // Leave seesion/open projects untouched when quitting.
  if (this._quitting) return

  await this.sessionStore.removeProject(key)
}
