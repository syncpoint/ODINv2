
const lastAccessDescending = (a, b) =>
  b.lastAccess.localeCompare(a.lastAccess)

/**
 *
 * @param {*} options
 * @param {String} options.platform
 * @param {{ id -> project }} options.projects
 */
export default options => {
  const platform = options.platform || process.platform
  const projects = options.projects || []
  const sortedProjects = [...projects].sort(lastAccessDescending)

  const recentProjects = sortedProjects.map(({ key, name }) => ({
    id: key,
    label: name,
    click: (menuItem, focusedWindow, focusedWebContents) => {
      console.log('command: file/recent', key)
    }
  }))

  return [{
    label: 'File',
    submenu: [
      {
        label: 'New Project',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: async (/* menuItem, browserWindow, event */) => {
          console.log('command: file/new project')
        }
      },
      { type: 'separator' },
      {
        label: 'Open Recent',
        submenu: recentProjects
      },
      platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
    ]
  }]
}
