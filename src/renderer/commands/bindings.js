import Mousetrap from 'mousetrap'
import 'mousetrap-global-bind'

const cmdOrCtrl = key => process.platform === 'darwin'
  ? `command+${key}`
  : `ctrl+${key}`

export const bindings = (emitter, clipboard) => {
  const emitCommand = command => () => emitter.emit(`command/${command}`)

  // Note: bindGlobal() is used to also trap inside input elements.
  Mousetrap.bindGlobal(cmdOrCtrl('p'), emitCommand('open-command-palette'))
  Mousetrap.bindGlobal(cmdOrCtrl('b'), emitCommand('toggle-sidebar'))
  Mousetrap.bindGlobal(cmdOrCtrl('1'), emitCommand('sidebar-layer'))
  Mousetrap.bindGlobal(cmdOrCtrl('2'), emitCommand('sidebar-symbol'))
  Mousetrap.bindGlobal(cmdOrCtrl('4'), emitCommand('sidebar-location'))

  Mousetrap.bind(cmdOrCtrl('backspace'), () => clipboard.delete())
  Mousetrap.bind('del', () => clipboard.delete())
}
