import Mousetrap from 'mousetrap'
import { Command } from './Command'



export function CommandRegistry (services) {

  const shortcut = (id, binding, description) => new Command({
    id,
    binding,
    description,
    body: () => services.emitter.emit(`command/${id}`)
  })

  this.commands_ = [
    shortcut('open-command-palette', 'meta+p', 'Open command palette'),
    shortcut('close-command-palette', null, 'Open command palette'),
    shortcut('key-escape', 'escape', 'Escape key')
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
