import { app, BrowserWindow, Menu } from 'electron'
import * as paths from './paths'
import { transferLegacy } from './legacy'
import { jsonStore } from '../shared/stores'
import { template } from './menu'
import Master from './Master'


// TODO: move to appropriate place
const showWindow = () => {
  const notCold = process.argv.indexOf('--cold') === -1
  const hot = process.defaultApp ||
    /[\\/]electron-prebuilt[\\/]/.test(paths.execPath) ||
    /[\\/]electron[\\/]/.test(paths.execPath)

  const url = (hot && notCold)
    ? new URL('index.html', 'http://localhost:8080')
    : new URL(paths.staticIndexPage(app), 'file:')

  const window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  window.loadURL(url.toString())
  window.once('ready-to-show', () => window.show())
}


/**
 * Emitted once, when Electron has finished initializing.
 */
const ready = async () => {

  // Open/create master database.
  const databases = paths.databases(app)
  paths.mkdir(databases)
  const master = new Master(jsonStore(paths.master(app)))

  // Note: Not triggered on SIGINT.
  app.once('quit', async () => {
    // Reference to master is no longer valid beyond this point.
    await master.close()
  })

  // Transfer legacy data if not already done.
  if (await master.getTransferred() === false) {
    const location = paths.odinHome
    transferLegacy(location, master, databases)
  }

  // TODO: restore last session
  showWindow()

  // TODO: test (dynamic) menu construction
  const menu = Menu.buildFromTemplate(template({
    platform: process.platform,
    appName: app.name,
    projects: {}
  }))

  Menu.setApplicationMenu(menu)
}


/**
 * Emitted when the application is quitting.
 * Note: On Windows, this event will not be emitted
 * if the app is closed due to a shutdown/restart of the
 * system or a user logout.
 */
const quit = () => {
  console.log('quit')
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
  app.once('quit', quit)
  app.on('activate', activate)
  app.on('window-all-closed', windowAllClosed)
}


// Run application when lock can be acquired,
// else exit immediately (second instance).

app.requestSingleInstanceLock()
  ? run()
  : app.quit()
