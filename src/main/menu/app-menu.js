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
  }
}
