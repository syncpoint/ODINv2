import LayerCommands from './commands/LayerCommands'
import TypeCommands from './commands/TypeCommands'
import StyleCommands from './commands/StyleCommands'
import IdentityCommands from './commands/IdentityCommands'
import StatusCommands from './commands/StatusCommands'
import EchelonCommands from './commands/EchelonCommands'
import ModifierCommands from './commands/ModifierCommands'
import MarkerCommands from './commands/MarkerCommands'


/**
 * @constructor
 */
export function PaletteCommands (options) {
  this.factories = [
    new LayerCommands(options),
    new TypeCommands(options),
    new StyleCommands(options),
    new IdentityCommands(options),
    new StatusCommands(options),
    new EchelonCommands(options),
    new ModifierCommands(options),
    new MarkerCommands(options)
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
