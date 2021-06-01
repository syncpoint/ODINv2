import { app, ipcMain } from 'electron'
import * as paths from './paths'
import { transferLegacy } from './legacy'
import { jsonStore } from '../shared/stores'
import { IPCServer } from '../shared/level/ipc'
import { Session } from './Session'
import { ApplicationMenu } from './menu'
import { WindowManager } from './WindowManager'
import { ProjectStore, SessionStore, LegacyStore } from './stores'

/**
 * Emitted once, when Electron has finished initializing.
 */
const ready = async () => {

  // Open/create master database.
  const databases = paths.databases(app)
  paths.mkdir(databases)
  const db = jsonStore(paths.master(app))

  // Emitted when all windows have been closed and the application will quit.
  app.once('will-quit', () => db.close())

  /* eslint-disable no-new */
  new IPCServer(db, ipcMain)
  /* eslint-enable no-new */

  const projectStore = new ProjectStore(db, ipcMain)
  const sessionStore = new SessionStore(db)
  const legacyStore = new LegacyStore(db)

  // Transfer legacy data if not already done.
  if (await legacyStore.getTransferred() === false) {
    const location = paths.odinHome
    await transferLegacy(location, legacyStore, databases)
  }

  const windowManager = new WindowManager()
  const session = new Session({ sessionStore, projectStore, windowManager })
  const menu = new ApplicationMenu(sessionStore)


  menu.on('project/open/:key', ({ key }) => session.openProject(key))
  menu.on('project/create', () => session.createProject())

  windowManager.on('window/closed/:id', event => {
    console.log('[main]', event.path)
    session.windowClosed(event.id)
  })

  windowManager.on('window/focus-gained/:id', event => {
    console.log('[main]', event.path)
    menu.show()
  })

  ipcMain.on('PREVIEW', ({ sender }, url) => {
    const handle = windowManager.handleFromId(sender.id)
    projectStore.putPreview(handle, url)
  })

  ipcMain.on('OPEN_PROJECT', (event, key) => {
    session.openProject(key)
  })

  await session.restore()
  await menu.show()
}


/**
 * Emitted when the application is activated.
 * Various actions can trigger this event, such as launching
 * the application for the first time, attempting to re-launch
 * the application when it's already running, or clicking on
 * the application's dock or taskbar icon.
 */
const activate = () => {
  console.log('activate')
  // TODO: create new window, when currently none is open.
}


/**
 * Emitted when all windows have been closed.
 */
const windowAllClosed = () => {
  // Keep macOS application running without any window.
  if (process.platform !== 'darwin') {
    app.quit()
  }
}


/**
 * Entry point for (first) application instance.
 */
const run = () => {
  app.once('ready', ready)
  app.on('activate', activate)
  app.on('window-all-closed', windowAllClosed)
}


// Run application when lock can be acquired,
// else exit immediately (second instance).

app.requestSingleInstanceLock()
  ? run()
  : app.quit()
