import os from 'os'
import path from 'path'
import { app, Menu } from 'electron'
import level from 'level'
import { evented, EVENT } from './evented'
import './window'
import { template } from './menu'
import * as Master from '../../src/main/master'
import * as Legacy from '../../src/main/legacy'
import * as Session from './session'
import * as L from '../shared/level'

const transferLegacy = async master => {

  const transferred = await L.get(master, 'legacy:transferred', false)
  if (transferred) return

  const userData = app.getPath('userData')
  const userHome = os.homedir()
  const directory = path.join(userHome, 'ODIN')
  const home = Legacy.home(directory)

  const databases = {}

  // true: transferred, false: already transferred
  const { sources, projects } = Master.transfer(master, project => {
    const name = project.split(':')[1]
    const directory = path.join(userData, 'databases', name)
    databases[name] = level(directory)
    return databases[name]
  })

  await projects(await Legacy.projects(home))
  await sources(await home.sources())

  // Close project databases after transfer (if any):
  const close = database => database.close()
  await Promise.all(Object.values(databases).map(close))
}

/**
 * Emitted once, when Electron has finished initializing.
 */
const ready = async () => {

  // Open/create master database and migrate legacy projects (if any).
  const userData = app.getPath('userData')
  Master.open(userData)

  await transferLegacy(Master.database())
  await Session.restore()

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
  console.log('[application] activate - UNHANDLED!')
}


/**
 * Track attempts to start additional program instances.
 */
const secondInstance = () => {
  console.log('[application] secondInstance - UNHANDLED!')
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
