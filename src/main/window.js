import { BrowserWindow } from 'electron'

export const create = options => {
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

  // TODO: update application menu when no window has focus
  window.on('close', () => console.log(`[window/${window.id}:${window.title}] close.`))
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
