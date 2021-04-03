import { app } from 'electron'
import { evented, COMMAND } from './evented'


// TODO: Application menu depends on focused window (if any.)
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

const fileMenu = projects => {

  const recentProjects = projects.map(project => ({
    id: project.id,
    label: project.name,
    click: (menuItem, focusedWindow, focusedWebContents) => {
      evented.emit(COMMAND.OPEN_PROJECT, { id: menuItem.id })
    }
  }))

  return {
    label: 'File',
    submenu: [
      {
        label: 'New Window',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: async (/* menuItem, browserWindow, event */) => {
          evented.emit(COMMAND.CREATE_PROJECT)
        }
      },
      { type: 'separator' },
      {
        label: 'Open Recent',
        submenu: recentProjects
      },
      darwin ? { role: 'close' } : { role: 'quit' }
    ]
  }
}

const viewMenu = {
  label: 'View',
  submenu: [
    { role: 'reload' },
    { role: 'forceReload' },
    { role: 'toggleDevTools' },
    { type: 'separator' },
    { role: 'resetZoom' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
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

          // FIXME: useless
          // TODO: add list windows
          { role: 'window' }
        ]
      : [{ role: 'close' }]
    )
  ]
}

export const template = projects => {
  return [
    ...appMenu,
    fileMenu(projects),
    viewMenu,
    windowMenu
  ]
}
