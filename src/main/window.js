import path from 'path'
import { BrowserWindow, app, ipcMain } from 'electron'
import * as Master from './master'
import { QUERY } from '../shared/ipc'

/**
 * Associate project id to unqiue window id.
 */
const projectWindows = {}

export const fromProjectId = projectId => {
  const entry = Object.entries(projectWindows).find(entry => entry[1] === projectId)
  if (entry) return BrowserWindow.fromId(parseInt(entry[0]))
}

ipcMain.handle(QUERY.PROJECT_CONFIGURATION, ({ sender }) => {
  return {
    projectId: projectWindows[sender.id],
    userData: app.getPath('userData')
  }
})


/**
 * Create window with various event listeners.
 */
const window = options => {
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
      contextIsolation: false
    }
  })

  window.on('blur', () => console.log(`[window/${window.id}:${window.title}] blur.`))

  // TODO: update application menu when focus is gained
  window.on('focus', () => console.log(`[window/${window.id}:${window.title}] focus.`))
  window.on('show', () => console.log(`[window/${window.id}:${window.title}] show.`))
  window.on('hide', () => console.log(`[window/${window.id}:${window.title}] hide.`))

  // Prevent window title to be overwritten by HTML page title:
  // See: https://www.electronjs.org/docs/api/browser-window#event-page-title-updated
  window.on('page-title-updated', event => event.preventDefault())

  window.loadURL(options.url.toString())
  window.once('ready-to-show', () => window.show())
  return window
}


/**
 * Create (main) window for existing project.
 */
export const projectWindow = project => {

  console.log('execPath', process.execPath)
  const notCold = process.argv.indexOf('--cold') === -1
  const hot = process.defaultApp ||
    /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
    /[\\/]electron[\\/]/.test(process.execPath)

  const mainURL = (hot && notCold)
    ? new URL('index.html', 'http://localhost:8080')
    : new URL(path.join(app.getAppPath(), 'dist', 'index.html'), 'file:')

  // Note: This will become webContents.browserWindowOptions, which seems not
  // to be documented at all.
  const options = {
    url: mainURL,
    title: project.name,
    x: project.x,
    y: project.y,
    width: project.width,
    height: project.height
  }

  const win = window(options)
  projectWindows[win.id] = project.id

  ;['resized', 'moved'].forEach(event => win.on(event, () => {
    const bounds = win.getBounds()
    Master.updateEntry(project.id, project => ({ ...project, ...bounds }))
  }))

  const windowClosed = () => {
    delete projectWindows[win.id]
    Master.updateEntry(project.id, project => ({ ...project, open: false }))
  }

  // TODO: update application menu when no window has focus
  win.on('close', windowClosed)

  // Don't react to window close event, when application is quitting,
  // because open projects from this session will be restored for next session.
  app.on('before-quit', () => win.off('close', windowClosed))
}
