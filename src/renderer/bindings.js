import Mousetrap from 'mousetrap'
import 'mousetrap-global-bind'

const cmdOrCtrl = key => process.platform === 'darwin'
  ? `command+${key}`
  : `ctrl+${key}`

export const bindings = (clipboard) => {
  // Note: bindGlobal() is used to also trap inside input elements.
  Mousetrap.bind(cmdOrCtrl('backspace'), () => clipboard.delete())
  Mousetrap.bind('del', () => clipboard.delete())
}
