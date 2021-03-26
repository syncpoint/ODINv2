import os from 'os'
import path from 'path'
import { app, BrowserWindow, Menu } from 'electron'
import level from 'level'
import { evented, EVENT, COMMAND } from './evented'
import './window'
import { template } from './menu'
import master from './master'
import { transfer } from './legacy'

const transferLegacy = async master => {
  const userData = app.getPath('userData')
  const userHome = os.homedir()
  const directory = path.join(userHome, 'ODIN')

  const databases = {}
  const options = {
    master,
    directory,
    projectDatabase: project => {
      const directory = path.join(userData, 'databases', project)
      databases[project] = level(directory)
      return databases[project]
    }
  }

  // true: transferred, false: already transferred
  const result = transfer(options)
  // Close project databases aftrer transfer (if any):
  await Promise.all(Object.values(databases).map(database => database.close()))
  return result
}

/**
 * Emitted once, when Electron has finished initializing.
 */
const ready = async () => {

  // Open/create master database and migrate legacy projects (if any).
  const userData = app.getPath('userData')
  master.open(userData)

  await transferLegacy(master.db())

  const menu = Menu.buildFromTemplate(template())
  Menu.setApplicationMenu(menu)
}


/**
 * Emitted when the application is quitting.
 * Note: On Windows, this event will not be emitted if the app
 * is closed due to a shutdown/restart of the system or a user logout.
 */
const quit = () => evented.emit(EVENT.QUIT)


/**
 * Emitted when the application is activated.
 * Various actions can trigger this event, such as launching
 * the application for the first time, attempting to re-launch
 * the application when it's already running, or clicking on
 * the application's dock or taskbar icon.
 *
 * Note:
 *  Minimized windows are also visible, or so it seems.
 *  When all windows are minimized, the first opened window will be restored automatically.
 *  This event seems not to be emitted on initial launch (at least not from command line).
 */
const activate = (/* event, hasWisibleWindows */) => {
  // Create new window, when none is open right now.
  const windows = BrowserWindow.getAllWindows()
  if (windows.length === 0) evented.emit(COMMAND.CREATE_WINDOW)
}


/**
 * Track attempts to start additional program instances.
 */
const secondInstance = () => {
  const windows = BrowserWindow.getAllWindows()
  if (windows.length === 0) evented.emit(COMMAND.CREATE_WINDOW)
}


const windowAllClosed = () => {
  // Leave macOS application running without any window.
  if (process.platform !== 'darwin') {
    app.quit()
  }
}


// Run, Forrest! Run!
export default () => {
  app.once('ready', ready)
  app.once('quit', quit)
  app.on('activate', activate)
  app.on('second-instance', secondInstance)
  app.on('window-all-closed', windowAllClosed)
}
