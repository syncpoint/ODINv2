import { app } from 'electron'

/**
 * @typedef {Object} SessionOptions
 * @property {SessionStore} sessionStore
 * @property {ProjectStore} projectStore
 * @property {WindowManager} windowManager
 */

/**
 * @param {SessionOptions} options
 * @constructor
 */
export function Session (options) {
  this.windowManager = options.windowManager
  this.sessionStore = options.sessionStore
  this.projectStore = options.projectStore

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
  const project = await this.projectStore.getProject(key)

  // Menu is refreshed implicitly, because existing (or new window) gain focus.
  await this.sessionStore.addRecent(key, project.name)

  if (this.windowManager.isWindowOpen(key)) {
    this.windowManager.focusWindow(key)
  } else {

    // Create and show project window.
    const window = await this.windowManager.showProject(key, project)

    ;['resized', 'moved'].forEach(event => window.on(event, () => {
      this.projectStore.updateWindowBounds(key, window.getBounds())
    }))

    if (this.windowManager.isWindowOpen('splash')) {
      this.windowManager.closeWindow('splash')
    }

    await this.sessionStore.addProject(key)
    window.show()
  }
}

Session.prototype.createProject = async function () {
  const key = 'splash'
  if (this.windowManager.isWindowOpen(key)) {
    return this.windowManager.focusWindow(key)
  } else {
    const window = await this.windowManager.showSplash()
    window.show()
  }
}

Session.prototype.windowClosed = async function (key) {

  // Leave seesion/open projects untouched when quitting.
  if (this._quitting) return

  await this.sessionStore.removeProject(key)
}
