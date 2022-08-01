import util from 'util'
import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import { error, ERR_INVALID_ARG } from '../shared/error'
import Emitter from '../shared/emitter'


/**
 * @constructor
 * @fires selection
 */
export function Selection () {
  Emitter.call(this)
  this.selected_ = []
}

util.inherits(Selection, Emitter)

Selection.delta = (previous, current) => {
  const removals = previous.filter(id => !current.includes(id))
  const additions = current.filter(id => !previous.includes(id))
  return { additions, removals }
}

/**
 * @deprecated move somewhere else!
 */
Selection.isEqual = (a, b) => {
  const as = [...a].sort()
  const bs = [...b].sort()
  return isEqual(as, bs)
}

Selection.prototype.isEmpty = function () {
  return this.selected_.length === 0
}

Selection.prototype.isSelected = function (entry) {
  return this.selected_.includes(entry)
}

Selection.prototype.selected = function (p = () => true) {
  return this.selected_.filter(p)
}

/**
 * select :: [string] -> unit
 * Add given selections.
 */
Selection.prototype.select = function (entries) {
  if (!entries) return
  if (!Array.isArray(entries)) throw error(ERR_INVALID_ARG, 'invalid argument; array expected')
  if (entries.length === 0) return
  if (entries.some(x => typeof x !== 'string')) throw error(ERR_INVALID_ARG, 'invalid argument; string elements expected')

  const selected = R.uniq(entries).filter(x => !this.selected_.includes(x))
  this.selected_ = [...this.selected_, ...selected]
  if (selected.length) this.emit('selection', { selected, deselected: [] })
}


/**
 * deselect :: [string] => unit
 * Remove given selections.
 */
Selection.prototype.deselect = function (entries) {
  if (entries && !Array.isArray(entries)) throw error(ERR_INVALID_ARG, 'invalid argument; array expected')
  if (entries.length === 0) return
  if (entries && entries.some(x => typeof x !== 'string')) throw error(ERR_INVALID_ARG, 'invalid argument; string element expected')

  const deselected = entries.filter(x => this.selected_.includes(x))
  this.selected_ = this.selected_.filter(x => !deselected.includes(x))
  if (deselected.length) this.emit('selection', { selected: [], deselected })
}


/**
 * set :: [string] => unit
 * Replace current with given selection.
 */
Selection.prototype.set = function (entries) {
  if (entries && !Array.isArray(entries)) throw error(ERR_INVALID_ARG, 'invalid argument; array expected')
  if (entries && entries.some(x => typeof x !== 'string')) throw error(ERR_INVALID_ARG, 'invalid argument; string element expected')

  const uniq = R.uniq(entries)
  const selected = uniq.filter(x => !this.selected_.includes(x))
  const deselected = this.selected_.filter(x => !uniq.includes(x))

  if (!selected.length && !deselected.length) return
  this.selected_ = [...uniq]
  this.emit('selection', { deselected, selected })
}


/**
 * Just forward a focus event with id of element to be focused.
 * This makes a little more sense than to use emitter directly.
 */
Selection.prototype.focus = function (id) {
  this.emit('focus', { id })
}
