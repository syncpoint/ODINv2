import util from 'util'
import { BrowserWindow, app } from 'electron'
import * as paths from './paths'
import Emitter from '../shared/emitter'

const url = app => {
  const notCold = process.argv.indexOf('--cold') === -1
  const hot = process.defaultApp ||
    /[\\/]electron-prebuilt[\\/]/.test(paths.execPath) ||
    /[\\/]electron[\\/]/.test(paths.execPath)

  return (hot && notCold)
    ? new URL('index.html', 'http://localhost:8080')
    : new URL(paths.staticIndexPage(app), 'file:')
}


/**
 * @constructor
 * @fires windows/closed/:handle
 * @fires windows/opened/:handle
 * @fires windows/focus-gained/:handle
 */
export const WindowManager = function () {
  Emitter.call(this)
  this.windows = {}
}

util.inherits(WindowManager, Emitter)


/**
 * @typedef {Object} WindowOptions
 *
 * @property {String} handle - window handle
 * @property {String} title - window title
 * @property {String[]} additionalArguments - forwarded to webPreferences.additionalArguments
 * @property {Number} [x] - window bounds x
 * @property {Number} [y] - window bounds y
 * @property {Number} [width] - window bounds width
 * @property {Number} [height] - window bounds height
 */


/**
 * @param {WindowOptions} options
 * @returns {Promise<BrowserWindow>}
 */
WindowManager.prototype.createWindow = function (options) {
  const { handle, url } = options
  const additionalArguments = options.additionalArguments || []

  return new Promise((resolve, reject) => {
    if (!handle) reject(new Error('window handle required'))
    if (!url) reject(new Error('window URL required'))

    const window = new BrowserWindow({

      // title String (optional) - Default window title.
      // Default is "Electron". If the HTML tag <title> is defined
      // in the HTML file loaded by loadURL(), this property will be ignored.
      title: options.title,
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      minimizable: options.minimizable ?? true,
      maximizable: options.maximizable ?? true,
      resizable: options.resizable ?? true,
      alwaysOnTop: options.alwaysOnTop ?? false,
      frame: !(options.frame === false),
      titleBarStyle: options.titleBarStyle || 'default',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,

        // See: https://github.com/electron/electron/issues/28511
        nativeWindowOpen: true,

        // String - A list of strings that will be appended to
        // process.argv in the renderer process of this app.
        // Useful for passing small bits of data down to renderer
        // process preload scripts.
        additionalArguments
      }
    })

    this.windows[window.id] = handle

    window.once('close', () => {
      delete this.windows[window.id]
      this.emit(`window/closed/${handle}`)
    })

    // Prevent window title to be overwritten by HTML page title:
    // See: https://www.electronjs.org/docs/api/browser-window#event-page-title-updated
    window.on('page-title-updated', event => event.preventDefault())

    window.on('enter-full-screen', ({ sender }) => {
      sender.webContents.send('IPC_ENTER_FULLSCREEN')
    })

    window.on('leave-full-screen', ({ sender }) => {
      sender.webContents.send('IPC_LEAVE_FULLSCREEN')
    })

    window.on('focus', () => {
      this.emit(`window/focus-gained/${handle}`)
    })

    window.loadURL(url.toString())
    window.once('ready-to-show', () => {
      this.emit(`window/opened/${handle}`)
      resolve(window)
    })
  })
}


/**
 * @param {String} handle - window handle
 * @returns {Promise<BrowserWindow>}
 * @private
 */
WindowManager.prototype.windowFromHandle = function (handle) {
  const entry = Object.entries(this.windows).find(entry => entry[1] === handle)
  if (!entry) return undefined
  const id = parseInt(entry[0])
  return BrowserWindow.fromId(id)
}


WindowManager.prototype.handleFromId = function (id) {
  return this.windows[id]
}

/**
 * @param {String} handle - window handle
 * @returns {boolean} whether or not a window with this handle is open
 */
WindowManager.prototype.isWindowOpen = function (handle) {
  return Object.values(this.windows).includes(handle)
}


/**
 * Focus window with given handle.
 *
 * @param {String} handle - window handle
 */
WindowManager.prototype.focusWindow = function (handle) {
  const window = this.windowFromHandle(handle)
  if (window) window.focus()
}


/**
 * Close window with given handle.
 *
 * @param {String} handle - window handle
 */
WindowManager.prototype.closeWindow = function (handle) {
  const window = this.windowFromHandle(handle)
  if (window) window.close()
}

WindowManager.prototype.reloadAll = function () {
  Object.values(this.windows).forEach(handle => {
    const window = this.windowFromHandle(handle)
    window?.reload()
  })
}


/**
 * Create and show project window.
 *
 * @param {String} key project id (also used as window handle)
 * @param {Object} project
 * @returns {Promise<BrowserWindow>}
 */
WindowManager.prototype.showProject = function (key, project) {
  const additionalArguments = [
    `--page=${key}`,
    `--databases=${paths.databases(app)}`
  ]

  return this.createWindow({
    handle: key,
    title: project.name,
    url: url(app),
    ...project.bounds,
    additionalArguments
  })
}


/**
 * Create and show splash window.
 *
 * @returns {Promise<BrowserWindow>}
 */
WindowManager.prototype.showSplash = function () {
  const additionalArguments = ['--page=splash']
  return this.createWindow({
    handle: 'splash',
    title: 'ODIN - Projects',
    url: url(app),
    additionalArguments
  })
}

WindowManager.prototype.showLogin = function () {
  const additionalArguments = ['--page=login']
  return this.createWindow({
    handle: 'login',
    title: 'Login and enable collaboration',
    url: url(app),
    minimizable: false,
    maximizable: false,
    resizable: false,
    alwaysOnTop: true,
    width: 640,
    height: 480,
    additionalArguments
  })
}

WindowManager.prototype.showLogout = function () {
  const additionalArguments = ['--page=logout']
  return this.createWindow({
    handle: 'logout',
    title: 'Logout and disable collaboration',
    url: url(app),
    minimizable: false,
    maximizable: false,
    resizable: false,
    alwaysOnTop: true,
    width: 640,
    height: 480,
    additionalArguments
  })
}

