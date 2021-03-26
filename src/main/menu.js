import { app } from 'electron'
import { evented, COMMAND } from './evented'

// TODO: Application menu depends on active window if any.
const darwin = process.platform === 'darwin'

const appMenu = darwin
  ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        // TODO: preferences
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }]
  : []

const fileMenu = {
  label: 'File',
  submenu: [
    {
      label: 'New Window',
      accelerator: 'CmdOrCtrl+Shift+N',
      click: async (/* menuItem, browserWindow, event */) => {
        evented.emit(COMMAND.CREATE_WINDOW)
      }
    },
    darwin ? { role: 'close' } : { role: 'quit' }
  ]
}

const windowMenu = {
  label: 'Window',
  submenu: [
    { role: 'minimize' },
    { role: 'zoom' },
    ...(darwin
      ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' } // FIXME: useless
        ]
      : [{ role: 'close' }]
    )
  ]
}

export const template = () => [...appMenu, fileMenu, windowMenu]
