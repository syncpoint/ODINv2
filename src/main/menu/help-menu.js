import { shell } from 'electron'

export default options => {
  return {
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        click: () => shell.openExternal('https://odin.syncpoint.io/docs/', { activate: true })
      },
      {
        label: "What's New",
        click: () => shell.openExternal('https://odin.syncpoint.io/docs/changelog/', { activate: true })
      },
      { type: 'separator' },
      {
        label: 'Join ODINv2 Community via [Matrix]',
        click: () => shell.openExternal('https://matrix.to/#/#ODIN.Community:syncpoint.io', { activate: true })
      }
    ]
  }
}
