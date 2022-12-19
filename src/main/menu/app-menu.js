export default options => {
  const platform = options.platform || process.platform
  const appName = options.appMenu || 'ODIN'

  const menu = {
    label: appName,
    submenu: [
      { role: 'about' }
    ]
  }

  if (platform !== 'darwin') {
    menu.submenu.push(
      { type: 'separator' },
      { role: 'quit' }
    )
  } else {
    menu.submenu.push(
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    )
  }
  return menu
}
