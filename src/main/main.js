import * as R from 'ramda'
import { app, ipcMain, shell } from 'electron'
import URL from 'url'
import * as paths from './paths'
import { transferLegacy } from './legacy/transfer'
import { leveldb } from '../shared/level'
import { IPCServer } from '../shared/level/ipc'
import { Session } from './Session'
import { ApplicationMenu } from './menu'
import { WindowManager } from './WindowManager'
import { ProjectStore, SessionStore, LegacyStore } from './stores'
import { ipc } from './ipc'

/**
 * Emitted once, when Electron has finished initializing.
 */
const ready = async () => {
  // loadReactChromeExtension()

  // Open/create master database.
  const databases = paths.databases(app)
  console.log('databases directory:', databases)
  paths.mkdir(databases)
  const db = leveldb({ location: paths.master(app), encoding: 'json' })

  // Emitted when all windows have been closed and the application will quit.
  app.once('will-quit', () => db.close())

  /* eslint-disable no-new */
  new IPCServer(db, ipcMain)
  /* eslint-enable no-new */

  const projectStore = new ProjectStore(db)
  const sessionStore = new SessionStore(db)
  const legacyStore = new LegacyStore(db)
  ipc(databases, ipcMain, projectStore)

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

  windowManager.on('window/closed/:id', ({ id }) => {
    session.windowClosed(id)
    if (id.startsWith('project:')) {
      projectStore.removeTag(id, 'open')
      const splash = windowManager.windowFromHandle('splash')
      if (splash) splash.webContents.postMessage('ipc:post:project/closed', { id })
    }
  })

  windowManager.on('window/opened/:id', async ({ id }) => {
    if (id.startsWith('project:')) await projectStore.addTag(id, 'open')
  })

  windowManager.on('window/focus-gained/:id', event => {
    menu.show()
  })

  ipcMain.on('PREVIEW', ({ sender }, url) => {
    const handle = windowManager.handleFromId(sender.id)
    projectStore.putPreview(handle, url)
  })

  ipcMain.on('OPEN_PROJECT', (event, key) => {
    session.openProject(key)
  })

  ipcMain.on('OPEN_LINK', async (event, link) => {
    const fileURLToPath = URL.fileURLToPath
    const openPath = shell.openPath
    const openExternal = url => shell.openExternal(url, { activate: true })

    const open =
      link.url.startsWith('file:')
        ? R.compose(openPath, fileURLToPath)
        : openExternal

    open(link.url)
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
  // TODO: 81c8e77a-3181-421f-8a64-8bb5590c2d34 - main: show project selection on activation (macOS)
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
