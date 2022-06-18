import util from 'util'
import * as R from 'ramda'
import Emitter from '../../shared/emitter'
import { isTaggableId, tagsId } from '../ids'
import { importSymbols } from './symbols'
import * as L from '../../shared/level'


/**
 * @constructor
 * @param {LevelUp} jsonDB properties database.
 * @param {LevelUp} wkbDB geometry database.
 * @param {Undo} undo
 * @param {Selection} selection
 *
 * @emits features/batch - complete features (properties and geometries)
 * @emits features/properties - feature properties only
 * @emits features/geometries - feature geometries only
 * @emits highlight/geometries
 */
export function Store (jsonDB, undo, selection) {
  Emitter.call(this)

  // Internal databases:
  // Properties: Properties (JSON) only
  // Geometries: Geometries (WKB) only
  // DB: Properties and Geometries combined

  this.jsonDB = jsonDB
  this.undo = undo
  this.selection = selection

  window.requestIdleCallback(async () => {
    const alreadyImported = await L.existsKey(this.jsonDB, L.prefix('symbol:'))
    if (!alreadyImported) await importSymbols(this.jsonDB)
  }, { timeout: 2000 })

}

util.inherits(Store, Emitter)


/**
 * @async
 * tuples :: String -> [[k, v]]
 * tuples :: [k] -> [[k, v]]
 */
Store.prototype.tuples = async function (arg) {
  return L.tuples(this.jsonDB, arg)
}


/**
 * @async
 * insert :: [[k, v]] -> unit
 */
Store.prototype.insert = async function (tuples) {
  const command = this.insertCommand(this.jsonDB, tuples)
  this.undo.apply(command)
}


/**
 * update :: { k: v } -> (v -> v) -> unit
 * update :: [k] -> [v] -> [v] -> unit
 * update :: [k] -> [v] -> unit
 */
Store.prototype.update = async function (...args) {
  if (args.length === 2) {
    if (typeof args[1] === 'function') {
      const [values, fn] = args
      const keys = Object.keys(values)
      const oldValues = Object.values(values)
      const newValues = oldValues.map(fn)
      return this.update(keys, newValues, oldValues)
    } else {
      // No undo, direct update.
      const [keys, values] = args
      this.jsonDB.batch(R.zip(keys, values).map(([key, value]) => L.putOp(key, value)))
    }
  } else if (args.length === 3) {
    const [keys, newValues, oldValues] = args
    const command = this.updateCommand(this.jsonDB, keys, newValues, oldValues)
    this.undo.apply(command)
  }
}


/**
 * @async
 * rename :: (k, String) -> unit
 */
Store.prototype.rename = async function (id, name) {
  const oldValue = await this.jsonDB.get(id)
  const newValue = { ...oldValue, name }
  const command = this.updateCommand(this.jsonDB, [id], [newValue], [oldValue])
  this.undo.apply(command)
}

// taggable :: k -> boolean
const addTag = name => tags => R.uniq([...(tags || []), name])
const removeTag = name => tags => (tags || []).filter(tag => tag !== name)


/**
 * @async
 * addTag :: k -> String -> unit
 */
Store.prototype.addTag = async function (id, name) {
  const taggableIds = this.selection.selected(isTaggableId)
  const ids = R.uniq([id, ...taggableIds]).map(tagsId)
  const values = await this.jsonDB.getMany(ids) // may include undefined entries
  const oldValues = values.map(value => value || [])
  const newValues = oldValues.map(addTag(name))
  const command = this.updateCommand(this.jsonDB, ids, newValues, oldValues)
  this.undo.apply(command)
}


/**
 * @async
 * removeTag :: k -> String -> unit
 */
Store.prototype.removeTag = async function (id, name) {
  const taggableIds = this.selection.selected(isTaggableId)
  const ids = R.uniq([id, ...taggableIds]).map(tagsId)
  const values = await this.jsonDB.getMany(ids) // may include undefined entries
  const oldValues = values.map(value => value || [])
  const newValues = oldValues.map(removeTag(name))
  const command = this.updateCommand(this.jsonDB, ids, newValues, oldValues)
  this.undo.apply(command)
}

Store.prototype.updateCommand = function (db, keys, newValues, oldValues) {
  const apply = () => db.batch(R.zip(keys, newValues).map(([key, value]) => L.putOp(key, value)))
  const inverse = () => this.updateCommand(db, keys, oldValues, newValues)
  return this.undo.command(apply, inverse)
}

Store.prototype.insertCommand = function (db, tuples) {
  const apply = () => db.batch(tuples.map(([key, value]) => L.putOp(key, value)))
  const inverse = () => this.deleteCommand(db, tuples)
  return this.undo.command(apply, inverse)
}

Store.prototype.deleteCommand = function (db, tuples) {
  const apply = () => db.batch(tuples.map(([key]) => L.delOp(key)))
  const inverse = () => this.insertCommand(db, tuples)
  return this.undo.command(apply, inverse)
}
