import Mousetrap from 'mousetrap'
import { Command } from './Command'


export function CommandRegistry (services) {

  const cmdOrCtrl = key => process.platform === 'darwin'
    ? `command+${key}`
    : `ctrl+${key}`

  const shortcut = (id, binding, description) => new Command({
    id,
    binding,
    description,
    body: () => {
      console.log(document.activeElement)
      services.emitter.emit(`command/${id}`)
    }
  })

  this.commands_ = [
    shortcut('open-command-palette', cmdOrCtrl('p'), 'Open command palette'),
    shortcut('toggle-sidebar', cmdOrCtrl('b'), 'Toggle sidebar'),
    shortcut('close-command-palette', null, 'Open command palette')
  ].reduce((acc, command) => {
    acc[command.id] = command
    return acc
  }, {})

  Object.values(this.commands_)
    .filter(command => command.binding())
    .forEach(command => Mousetrap.bind(command.binding(), command.invoke.bind(command)))
}

CommandRegistry.prototype.commands = function () {
  return this.commands_
}

CommandRegistry.prototype.command = function (id) {
  return this.commands[id]
}
