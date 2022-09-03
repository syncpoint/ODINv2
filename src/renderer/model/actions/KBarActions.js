import Global from './Global'
import Type from './Type'
import Style from './Style'
import Identity from './Identity'
import Status from './Status'
import Echelon from './Echelon'


/**
 * @constructor
 */
export function KBarActions (options) {
  this.options = options
  this.factories = [
    new Type(options),
    new Style(options),
    new Identity(options),
    new Status(options),
    new Echelon(options)
  ]
}

/**
 *
 */
KBarActions.prototype.actions = function (tuples) {
  if (!tuples) return []

  return this.factories
    .flatMap(factory => factory.actions(tuples))
    .flat()
}

/**
 *
 */
KBarActions.prototype.global = function () {
  return new Global(this.options).actions()
}
