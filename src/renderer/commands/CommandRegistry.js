import Mousetrap from 'mousetrap'
import { Command } from './Command'



const COMMANDS = services => {

  const shortcut = (binding, path, description) =>
    new Command({
      binding,
      description,
      body: () => services.emitter.emit(path)
    })

  return [
    shortcut('meta+p', 'command/open-command-palette', 'Open command palette'),
    shortcut('escape', 'command/escape')
  ]
}

export function CommandRegistry (services) {
  COMMANDS(services)
    .filter(command => command.binding())
    .forEach(command => Mousetrap.bind(command.binding(), command.invoke.bind(command)))
}

CommandRegistry.prototype.commands = function () {
  return this.commands_
}
