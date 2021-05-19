import { BrowserWindow, app } from 'electron'
import * as paths from './paths'

const url = app => {
  const notCold = process.argv.indexOf('--cold') === -1
  const hot = process.defaultApp ||
    /[\\/]electron-prebuilt[\\/]/.test(paths.execPath) ||
    /[\\/]electron[\\/]/.test(paths.execPath)

  return (hot && notCold)
    ? new URL('index.html', 'http://localhost:8080')
    : new URL(paths.staticIndexPage(app), 'file:')
}

export const WindowManager = function (evented) {

  /** _windows :: { window.id -> handle } */
  this.windows = {}
  this.evented = evented
}

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
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,

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
      this.evented.emit(`${handle}/close`)
    })

    // Prevent window title to be overwritten by HTML page title:
    // See: https://www.electronjs.org/docs/api/browser-window#event-page-title-updated
    window.on('page-title-updated', event => event.preventDefault())

    window.on('focus', () => {
      this.evented.emit(`${handle}/focus`)
    })

    window.loadURL(url.toString())
    window.once('ready-to-show', () => resolve(window))
  })
}

WindowManager.prototype.windowFromHandle = function (handle) {
  const entry = Object.entries(this.windows).find(entry => entry[1] === handle)
  if (!entry) return undefined
  const id = parseInt(entry[0])
  return BrowserWindow.fromId(id)
}

WindowManager.prototype.isWindowOpen = function (handle) {
  return Object.values(this.windows).includes(handle)
}

WindowManager.prototype.focusWindow = function (handle) {
  const window = this.windowFromHandle(handle)
  if (window) window.focus()
}

WindowManager.prototype.closeWindow = function (handle) {
  const window = this.windowFromHandle(handle)
  if (window) window.close()
}

WindowManager.prototype.showProject = async function (key, project) {
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

WindowManager.prototype.showSplash = function () {
  const additionalArguments = ['--page=splash']
  return this.createWindow({
    handle: 'splash',
    title: 'ODIN',
    url: url(app),
    additionalArguments
  })
}
