import { app, Menu, ipcMain } from 'electron'
import * as paths from './paths'
import { transferLegacy } from './legacy'
import { jsonStore } from '../shared/stores'
import { template } from './menu'
import Master from './Master'
import * as Window from './window'
import { IPCServer } from '../shared/level/ipc'

/**
 * Emitted once, when Electron has finished initializing.
 */
const ready = async () => {

  // Open/create master database.
  const databases = paths.databases(app)
  paths.mkdir(databases)
  const db = jsonStore(paths.master(app))
  const master = new Master(db)

  /* eslint-disable no-new */
  new IPCServer(db, ipcMain)
  /* eslint-enable no-new */

  // Note: Not triggered on SIGINT.
  app.once('quit', async () => {
    // Reference to master is no longer valid beyond this point.
    await master.close()
  })

  // Transfer legacy data if not already done.
  if (await master.getTransferred() === false) {
    const location = paths.odinHome
    await transferLegacy(location, master, databases)
  }

  // FIXME: temporary - create/show any project window
  const projects = await master.getProjects()

  {
    const window = await Window.splashScreen()
    window.show()
  }

  if (projects.length) {
    const window = await Window.projectWindow(projects[0])
    ;['resized', 'moved'].forEach(event => window.on(event, () => {
      master.putWindowBounds(projects[0].key, window.getBounds())
    }))

    window.show()
  }

  // TODO: test (dynamic) menu construction
  const menu = Menu.buildFromTemplate(template({
    platform: process.platform,
    appName: app.name,
    // TODO: replace `projects` with factory for menu items for 'Open Recent'
    projects
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
