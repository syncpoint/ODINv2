import TypeCommands from './commands/TypeCommands'
import StyleCommands from './commands/StyleCommands'
import IdentityCommands from './commands/IdentityCommands'
import StatusCommands from './commands/StatusCommands'
import EchelonCommands from './commands/EchelonCommands'
import ModifierCommands from './commands/ModifierCommands'


/**
 * @constructor
 */
export function PaletteCommands (options) {
  this.factories = [
    new TypeCommands(options),
    new StyleCommands(options),
    new IdentityCommands(options),
    new StatusCommands(options),
    new EchelonCommands(options),
    new ModifierCommands(options)
  ]
}

/**
 *
 */
PaletteCommands.prototype.getCommands = function (tuples) {
  if (!tuples) return []

  return this.factories
    .flatMap(factory => factory.commands(tuples))
    .flat()
}
