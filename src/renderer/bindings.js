import Mousetrap from 'mousetrap'
import 'mousetrap-global-bind'

const cmdOrCtrl = key => window.odin.platform.isMac
  ? `command+${key}`
  : `ctrl+${key}`

export const bindings = (commandRegistry, emitter) => {
  const [/* unused */, deleteCommand] = commandRegistry.command('CLIPBOARD_DELETE')

  // Note: bindGlobal() is used to also trap inside input elements.
  Mousetrap.bind(cmdOrCtrl('backspace'), () => {
    if (deleteCommand.enabled()) deleteCommand.execute()
  })

  Mousetrap.bind('del', () => {
    if (deleteCommand.enabled()) deleteCommand.execute()
  })

  Mousetrap.bind('esc', () => emitter.emit('command/draw/cancel'))
}
