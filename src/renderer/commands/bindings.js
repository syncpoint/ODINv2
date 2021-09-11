import Mousetrap from 'mousetrap'
import 'mousetrap-global-bind'

const cmdOrCtrl = key => process.platform === 'darwin'
  ? `command+${key}`
  : `ctrl+${key}`

export const bindings = emitter => {
  const emitCommand = command => () => emitter.emit(`command/${command}`)

  // Note: bindGlobal() is used to also trap inside input elements.
  Mousetrap.bindGlobal(cmdOrCtrl('p'), emitCommand('open-command-palette'))
  Mousetrap.bindGlobal(cmdOrCtrl('b'), emitCommand('toggle-sidebar'))
  Mousetrap.bindGlobal(cmdOrCtrl('1'), emitCommand('sidebar-layer'))
  Mousetrap.bindGlobal(cmdOrCtrl('2'), emitCommand('sidebar-symbol'))
  Mousetrap.bind(cmdOrCtrl('backspace'), emitCommand('delete'))
}
