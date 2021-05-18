import { app } from 'electron'
import * as R from 'ramda'

export function Session (master, windowManager, evented) {
  this._master = master
  this._windowManager = windowManager

  evented.on('command:project/open', ({ key }) => this.openProject(key))
  evented.on('command:project/create', () => this.createProject())
  evented.on(':id/close', ({ id }) => this.windowClosed(id))

  // Emitted before the application starts closing its windows.
  app.once('before-quit', async () => {
    this._quitting = true
  })
}

Session.prototype.restore = async function () {

  // await this._master.putSession({ projects: [] })
  const session = await this._master.getSession()
  const projects = R.uniq(session.projects)

  if (projects.length) {
    await Promise.all(projects.map(key => this.openProject(key)))
  } else {
    const window = await this._windowManager.showSplash()
    window.show()
  }
}

Session.prototype.openProject = async function (key) {

  if (this._windowManager.isWindowOpen(key)) {
    return this._windowManager.focusWindow(key)
  }

  // TODO: update project lastAccess to now

  const project = await this._master.getProject(key)
  const window = await this._windowManager.showProject(project)

  ;['resized', 'moved'].forEach(event => window.on(event, () => {
    // TODO: move window bounds to session scope
    this._master.putWindowBounds(key, window.getBounds())
  }))

  const session = await this._master.getSession()
  const projects = R.uniq(session.projects)
  projects.push(key)
  await this._master.putSession({
    ...session,
    projects: R.uniq(projects)
  })

  window.show()
}

Session.prototype.createProject = function () {
  console.log('[Session] createProject')
}

Session.prototype.windowClosed = async function (key) {

  // Leave seesion/open projects untouched when quitting.
  if (this._quitting) return

  const session = await this._master.getSession()
  session.projects = session.projects.filter(_key => _key !== key)
  this._master.putSession(session)
}
