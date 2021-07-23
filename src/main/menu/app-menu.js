export default options => {
  const platform = options.platform || process.platform
  const appName = options.appMenu || 'ODIN'

  if (platform !== 'darwin') return []
  else {
    return [{
      label: appName,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        // TODO: 42b6df1b-c791-4585-baf6-eedd22b08bf3 - menu: preferences/application (if any)
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }]
  }
}
