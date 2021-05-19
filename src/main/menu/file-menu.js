/**
 * @param {*} options
 * @param {String} options.platform
 * @param {String} options.sessionStore
 * @param {String} options.evented
 * @param {{ id -> project }} options.projects
 */
export default async options => {
  const { sessionStore, evented } = options
  const platform = options.platform || process.platform
  const recent = await sessionStore.getRecent()

  const submenu = recent.map(({ key, name }) => ({
    id: key,
    label: name,
    click: (menuItem, focusedWindow, focusedWebContents) => {
      evented.emit('command:project/open', { key })
    }
  }))

  return {
    label: 'File',
    submenu: [
      {
        label: 'New Project',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: async (/* menuItem, browserWindow, event */) => {
          evented.emit('command:project/create')
        }
      },
      { type: 'separator' },
      {
        label: 'Open Recent',
        submenu
      },
      platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
    ]
  }
}
