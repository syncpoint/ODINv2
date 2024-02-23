import Mousetrap from 'mousetrap'
import 'mousetrap-global-bind'

const cmdOrCtrl = key => process.platform === 'darwin'
  ? `command+${key}`
  : `ctrl+${key}`

export const bindings = (commandRegistry, emitter) => {

  const [/* unused */, deleteCommand] = commandRegistry.command('CLIPBOARD_DELETE')


  // Note: bindGlobal() is used to also trap inside input elements.
  Mousetrap.bind(cmdOrCtrl('backspace'), () => { console.log('CMD+CTRL+Backspace key binding'); if (deleteCommand.enabled()) deleteCommand.execute() })
  Mousetrap.bind('del', () => { console.log('DEL key binding'); if (deleteCommand.enabled()) deleteCommand.execute() })
  Mousetrap.bind('esc', () => emitter.emit('command/draw/cancel'))
}
