import { app } from 'electron'

export function Session (sessionStore, projectStore, windowManager) {
  this.windowManager = windowManager
  this.sessionStore = sessionStore
  this.projectStore = projectStore

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
