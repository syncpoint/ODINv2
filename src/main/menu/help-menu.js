import { shell } from 'electron'

export default options => {
  return {
    label: 'Help',
    submenu: [
      {
        label: 'Join ODINv2 Community via [Matrix]',
        click: () => shell.openExternal('https://matrix.to/#/#ODIN.Community:syncpoint.io', { activate: true })
      }
    ]
  }
}
