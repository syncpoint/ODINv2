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
    await Promise.all(projects.map(id => this.openProject(id)))
  } else {
    const window = await this.windowManager.showSplash()
    window.show()
  }
}

Session.prototype.openProject = async function (id) {
  const project = await this.projectStore.getProject(id)

  // Menu is refreshed implicitly, because existing (or new window) gain focus.
  await this.sessionStore.addRecent(id, project.name)

  if (this.windowManager.isWindowOpen(id)) {
    this.windowManager.focusWindow(id)
  } else {

    // Create and show project window.
    const window = await this.windowManager.showProject(id, project)

    const updateWindowState = () => {
      this.projectStore.updateWindowBounds(id, {
        ...window.getBounds(),
        fullscreen: window.isFullScreen(),
        maximized: window.isMaximized()
      })
    }

    ;['resized', 'moved', 'close', 'enter-full-screen', 'leave-full-screen', 'maximize', 'unmaximize'].forEach(event =>
      window.on(event, updateWindowState)
    )

    if (this.windowManager.isWindowOpen('splash')) {
      this.windowManager.closeWindow('splash')
    }

    await this.sessionStore.addProject(id)
    window.show()

    // Restore fullscreen/maximized state after window is shown
    if (project.bounds?.fullscreen) {
      window.setFullScreen(true)
    } else if (project.bounds?.maximized) {
      window.maximize()
    }
  }
}

Session.prototype.createProject = async function () {
  const id = 'splash'
  if (this.windowManager.isWindowOpen(id)) {
    return this.windowManager.focusWindow(id)
  } else {
    const window = await this.windowManager.showSplash()
    window.show()
  }
}

Session.prototype.windowClosed = async function (id) {

  // Leave seesion/open projects untouched when quitting.
  if (this._quitting) return

  console.log('[Session] windowClosed', id)
  if (id.startsWith('project:')) {
    await this.sessionStore.removeProject(id)
  }
}
