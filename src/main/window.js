import path from 'path'
import { app, BrowserWindow } from 'electron'
import { evented, COMMAND } from './evented'

const randomNames = [
  'Mario Powell',
  'Van Cook',
  'Larry Chapman',
  'Olive Hines',
  'Ernestine Abbott',
  'Lena Knight',
  'Fannie Fuller',
  'Jesus Buchanan',
  'Shirley Carr',
  'Danielle Hardy'
]

export const createWindow = () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,

    // title String (optional) - Default window title.
    // Default is "Electron". If the HTML tag <title> is defined
    // in the HTML file loaded by loadURL(), this property will be ignored.
    title: randomNames[Math.floor(Math.random() * randomNames.length)],
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  const devServer = process.argv.indexOf('--noDevServer') === -1
  const hotDeployment = process.defaultApp ||
    /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
    /[\\/]electron[\\/]/.test(process.execPath)

  const url = (hotDeployment && devServer)
    ? new URL('index.html', 'http://localhost:8080')
    : new URL(path.join(app.getAppPath(), 'dist', 'index.html'), 'file:')

  // TODO: update application menu when no window has focus
  window.on('close', () => console.log(`[window/${window.id}:${window.title}] close.`))
  window.on('blur', () => console.log(`[window/${window.id}:${window.title}] blur.`))

  // TODO: update application menu when focus is gained
  window.on('focus', () => console.log(`[window/${window.id}:${window.title}] focus.`))
  window.on('show', () => console.log(`[window/${window.id}:${window.title}] show.`))
  window.on('hide', () => console.log(`[window/${window.id}:${window.title}] hide.`))
  window.on('resized', () => console.log(`[window/${window.id}:${window.title}] resized.`))

  // Prevent window title to be overwritten by HTML page title:
  // See: https://www.electronjs.org/docs/api/browser-window#event-page-title-updated
  window.on('page-title-updated', event => event.preventDefault())

  window.loadURL(url.toString())
  window.once('ready-to-show', () => window.show())
}

evented.on(COMMAND.CREATE_WINDOW, () => createWindow())
