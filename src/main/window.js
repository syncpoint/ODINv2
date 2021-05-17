import { BrowserWindow, app } from 'electron'
import * as paths from './paths'

/**
 * { BrowserWindow.id -> handle }
 * Open windows.
 */
const windows = {}

export const fromHandle = handle => {
  const entry = Object.entries(windows).find(entry => entry[1] === handle)
  if (entry) return BrowserWindow.fromId(parseInt(entry[0]))
}

export const createWindow = options => new Promise((resolve, reject) => {
  const { handle, url } = options
  const additionalArguments = options.additionalArguments || []

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

  windows[window.id] = handle

  window.once('close', () => {
    delete windows[window.id]
  })

  // Prevent window title to be overwritten by HTML page title:
  // See: https://www.electronjs.org/docs/api/browser-window#event-page-title-updated
  window.on('page-title-updated', event => event.preventDefault())

  window.loadURL(url.toString())
  window.once('ready-to-show', () => resolve(window))
})


const url = app => {
  const notCold = process.argv.indexOf('--cold') === -1
  const hot = process.defaultApp ||
    /[\\/]electron-prebuilt[\\/]/.test(paths.execPath) ||
    /[\\/]electron[\\/]/.test(paths.execPath)

  return (hot && notCold)
    ? new URL('index.html', 'http://localhost:8080')
    : new URL(paths.staticIndexPage(app), 'file:')
}

export const projectWindow = async project => {
  const additionalArguments = [
    `--page=${project.key}`,
    `--databases=${paths.databases(app)}`
  ]

  return createWindow({
    handle: project.key,
    title: project.name,
    url: url(app),
    ...project.bounds,
    additionalArguments
  })
}

export const splashScreen = () => createWindow({
  handle: 'splash',
  title: 'ODIN',
  url: url(app),
  additionalArguments: ['--page=splash']
})
