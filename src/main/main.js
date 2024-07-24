import * as R from 'ramda'
import { app, ipcMain, shell, BrowserWindow } from 'electron'
import URL from 'url'
import * as paths from './paths'
import { transferLegacy } from './legacy/transfer'
import { leveldb } from '../shared/level'
import { IPCServer } from '../shared/level/ipc'
import { Session } from './Session'
import { ApplicationMenu } from './menu'
import { WindowManager } from './WindowManager'
import { ProjectStore, SessionStore, LegacyStore, PreferencesProvider } from './stores'
import { exportLayer } from './export.js'
import { ipc } from './ipc'
import * as dotenv from 'dotenv'
import SelfUpdate from './SelfUpdate'
import { isEnabled } from './environment'

/**
 * Emitted once, when Electron has finished initializing.
 */
const ready = async () => {
  // read environment variables from .env file and add to process.env
  console.log(`looking for .env file ${paths.dotenv(app)}`)
  dotenv.config({ debug: true, path: paths.dotenv(app) })

  // loadReactChromeExtension()

  // Open/create master database.
  const databases = paths.databases(app)
  console.log('databases directory:', databases)
  paths.mkdir(databases)
  const db = leveldb({ location: paths.master(app), encoding: 'json' })

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
  const preferencesProvider = new PreferencesProvider(windowManager, ipcMain)

  preferencesProvider.on('preferencesChanged', ({ projectId, preferences }) => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (!focusedWindow) return

    const handle = windowManager.handleFromId(focusedWindow.id)
    if (handle !== projectId) return

    menu.show(preferences)
  })

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

  windowManager.on('window/focus-gained/:id', ({ id }) => {
    menu.show(preferencesProvider.preferences(id))
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

  ipcMain.on('EXPORT_LAYER', exportLayer)

  await session.restore()
  await menu.show()

  if (isEnabled('ODIN_SELF_UPDATE', true)) {
    const selfUpdate = new SelfUpdate()
    selfUpdate.checkForUpdates()
  }
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
  app.on('window-all-closed', windowAllClosed)
}


// Run application when lock can be acquired,
// else exit immediately (second instance).

app.requestSingleInstanceLock()
  ? run()
  : app.quit()
