import * as R from 'ramda'
import { app, dialog, ipcMain, shell, BrowserWindow, protocol, session, net } from 'electron'
import fs from 'fs'
import path from 'path'
import URL from 'url'
import { initPaths } from './paths'
import { transferLegacy } from './legacy/transfer'
import { leveldb } from '../shared/level'
import { IPCServer } from '../shared/level/ipc'
import { Session } from './Session'
import { ApplicationMenu } from './menu'
import { WindowManager } from './WindowManager'
import { ProjectStore, SessionStore, LegacyStore, PreferencesProvider } from './stores'
import { exportLayer } from './export.js'
import { ipc } from './ipc'
import { Collaboration } from './Collaboration'
import * as dotenv from 'dotenv'
import SelfUpdate from './SelfUpdate'
import { isEnabled } from './environment'

const paths = initPaths(app)

/**
 * Emitted once, when Electron has finished initializing.
 */
const ready = async () => {
  // read environment variables from .env file and add to process.env
  dotenv.config({ debug: false, quiet: true, path: paths.dotenv })

  // Register app:// protocol handler to serve static files from dist/.
  const distPath = path.join(app.getAppPath(), 'dist')
  protocol.handle('app', (request) => {
    const requestURL = new globalThis.URL(request.url)
    const filePath = path.join(distPath, path.normalize(requestURL.pathname))
    if (!filePath.startsWith(distPath)) {
      return new Response('Forbidden', { status: 403 })
    }
    return net.fetch('file://' + filePath)
  })

  // Inject Content-Security-Policy and augment CORS headers.
  const csp = [
    'default-src \'self\'',
    'script-src \'self\'',
    'style-src \'self\' \'unsafe-inline\'',
    'img-src \'self\' https: http: data: blob:',
    'connect-src \'self\' https: http: ws: wss:',
    'font-src \'self\'',
    'worker-src \'self\' blob:',
    'child-src \'self\' blob:',
    'frame-src \'none\'',
    'base-uri \'self\'',
    'form-action \'self\''
  ].join('; ')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders }

    // Add CSP to app-origin and dev-server responses.
    const isAppOrigin = details.url.startsWith('app://') ||
      details.url.startsWith('http://localhost')
    if (isAppOrigin) {
      headers['Content-Security-Policy'] = [csp]
    }

    // Add CORS header to external responses that don't already include it.
    if (!isAppOrigin && !details.url.startsWith('file://')) {
      const hasACAllowOrigin = Object.keys(headers).some(
        key => key.toLowerCase() === 'access-control-allow-origin'
      )
      if (!hasACAllowOrigin) {
        headers['Access-Control-Allow-Origin'] = ['*']
      }
    }

    callback({ responseHeaders: headers })
  })

  // Open/create master database.
  paths.initStorageLocation()
  const db = leveldb({ location: paths.master, encoding: 'json' })

  /* eslint-disable no-new */
  new IPCServer(db, ipcMain)
  /* eslint-enable no-new */

  const projectStore = new ProjectStore(db)
  const sessionStore = new SessionStore(db)
  const legacyStore = new LegacyStore(db)

  ipc(ipcMain, projectStore)

  // Transfer legacy data if not already done.
  if (await legacyStore.getTransferred() === false) {
    await transferLegacy(paths, legacyStore)
  }

  const windowManager = new WindowManager()
  const appSession = new Session({ sessionStore, projectStore, windowManager })
  const menu = new ApplicationMenu({ sessionStore, projectStore })
  const collaboration = new Collaboration({ sessionStore, projectStore, windowManager })
  const preferencesProvider = new PreferencesProvider(windowManager, ipcMain)

  preferencesProvider.on('preferencesChanged', ({ projectId, preferences }) => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (!focusedWindow) return

    const handle = windowManager.handleFromId(focusedWindow.id)
    if (handle !== projectId) return

    menu.show(preferences)
  })

  menu.on('project/open/:key', ({ key }) => appSession.openProject(key))
  menu.on('project/create', () => appSession.createProject())
  menu.on('collaboration/enable', () => collaboration.login())
  menu.on('collaboration/disable', () => collaboration.logout())

  windowManager.on('window/closed/:id', ({ id }) => {
    appSession.windowClosed(id)
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
    appSession.openProject(key)
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

  ipcMain.on('RELOAD_ALL_WINDOWS', () => {
    windowManager.reloadAll()
  })

  ipcMain.on('CLOSE_WINDOW', (event, handle) => {
    windowManager.closeWindow(handle)
  })

  ipcMain.on('REFRESH_MENU', () => menu.show())

  ipcMain.handle('PURGE_COLLABORATION_SETTINGS', async () => {
    await collaboration.purgeSettings()
    windowManager.reloadAll()
  })
  ipcMain.on('COLLABORATION_REFRESH_LOGIN', () => collaboration.login())

  ipcMain.on('EXPORT_LAYER', exportLayer)

  ipcMain.handle('SAVE_FILE', async (event, fileName, data, filters) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const { canceled, filePath } = await dialog.showSaveDialog(window, {
      defaultPath: fileName,
      filters: filters || []
    })
    if (canceled || !filePath) return false
    await fs.promises.writeFile(filePath, Buffer.from(data))
    return true
  })

  await appSession.restore()
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


// Register custom protocol scheme before app is ready.
// Must be called before app.ready per Electron requirements.
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    corsEnabled: true,
    stream: true
  }
}])

// Run application when lock can be acquired,
// else exit immediately (second instance).

app.requestSingleInstanceLock()
  ? run()
  : app.quit()
