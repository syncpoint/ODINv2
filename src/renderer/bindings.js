import Mousetrap from 'mousetrap'
import 'mousetrap-global-bind'

const cmdOrCtrl = key => process.platform === 'darwin'
  ? `command+${key}`
  : `ctrl+${key}`

export const bindings = (emitter, clipboard) => {
  const emitCommand = command => () => emitter.emit(`command/${command}`)

  // Note: bindGlobal() is used to also trap inside input elements.
  Mousetrap.bindGlobal(cmdOrCtrl('p'), emitCommand('open-command-palette'))
  Mousetrap.bind(cmdOrCtrl('backspace'), () => clipboard.delete())
  Mousetrap.bind('del', () => clipboard.delete())
}
