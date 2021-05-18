const lastAccessDescending = (a, b) =>
  b.lastAccess.localeCompare(a.lastAccess)

/**
 *
 * @param {*} options
 * @param {String} options.platform
 * @param {{ id -> project }} options.projects
 */
export default async options => {
  const { master, evented } = options
  const platform = options.platform || process.platform

  // TODO: replace project list with __recent__ project list.
  const projects = await master.getProjects()
  const sortedProjects = [...projects].sort(lastAccessDescending)
  const recentProjects = sortedProjects.map(({ key, name }) => ({
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
        submenu: recentProjects
      },
      platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
    ]
  }
}
