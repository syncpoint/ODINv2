import Mousetrap from 'mousetrap'
import 'mousetrap-global-bind'

const cmdOrCtrl = key => process.platform === 'darwin'
  ? `command+${key}`
  : `ctrl+${key}`

export const bindings = emitter => {
  const emitCommand = command => () => emitter.emit(`command/${command}`)
  Mousetrap.bindGlobal(cmdOrCtrl('p'), emitCommand('open-command-palette'))
  Mousetrap.bindGlobal(cmdOrCtrl('b'), emitCommand('toggle-sidebar'))
  Mousetrap.bind(cmdOrCtrl('a'), () => emitCommand('edit/select-all'))
}
