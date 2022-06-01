import util from 'util'
import * as R from 'ramda'
import uuid from 'uuid-random'
import Emitter from '../../shared/emitter'
import { isFeatureId, isGroupId, featureId, isLayerId, isSymbolId, layerUUID } from '../ids'
import { importSymbols } from './symbols'
import { HighLevel } from '../../shared/level/HighLevel'
import { PartitionDOWN } from '../../shared/level/PartitionDOWN'
import { leveldb } from '../../shared/level'


/**
 * @constructor
 * @param {LevelUp} propertiesLevel properties database.
 * @param {LevelUp} geometryLevel geometry database.
 * @param {Undo} undo
 * @param {Selection} selection
 *
 * @emits features/batch - complete features (properties and geometries)
 * @emits features/properties - feature properties only
 * @emits features/geometries - feature geometries only
 * @emits highlight/geometries
 *
 * MANIFEST
 * collectKeys_ :: Key k => [k] -> [k]
 * update_ :: Key k, Value v => (k -> k, [v]) -> unit
 *
 * selectFeatures :: GeoJSON/Feature a => () -> [a]
 * selectProperties :: Key k, Value v => k => [v]
 * selectProperties :: Key k, Value v => [k] => [v]
 * selectGeometries :: Key k => k -> [GeoJSON/Geometry]
 * selectGeometries :: Key k => [k] -> [GeoJSON/Geometry]
 * delete :: Key k => [k] -> unit
 * insert :: Value v => [v] -> unit
 * update :: Value v => [v] -> unit
 * update :: Value v => ([v], [v]) -> unit
 * select :: Key k, Value v => [k] => [v]
 * entries :: Prefix p, Key k, Value v => p -> {k: v}
 * entries :: Key k, Value v => [k] -> {k: v}
 * keys :: Prefix p, Key k => p -> [k]
 * insertFeatures :: GeoJSON/Feature a => [a] -> unit
 * rename :: Key k, Name n => (k, n) -> unit
 * addTag :: Key k, Name n => (k, n) -> unit
 * removeTag :: Key k, Name n => (k, n) -> unit
 * hide :: Key k => k -> unit
 * show :: Key k => k -> unit
 * lock :: Key k => k -> unit
 * unlock :: Key k => k -> unit
 *
 * compositeCommand :: Command a => [a] -> a
 * insertCommand :: Value v => [a] -> Command
 * deleteCommand :: Value v => [a] -> Command
 * updateCommand :: Value v => ([a], [a]) -> Command
 */
export function Store (propertiesLevel, geometryLevel, undo, selection) {
  Emitter.call(this)

  // Internal databases:
  // Properties: Properties (JSON) only
  // Geometries: Geometries (WKB) only
  // DB: Properties and Geometries combined

  this.properties_ = new HighLevel(propertiesLevel)
  this.geometries_ = new HighLevel(geometryLevel)
  const down = new PartitionDOWN(propertiesLevel, geometryLevel)
  const up = leveldb({ down })
  this.db_ = new HighLevel(up)

  // Forward high-level batch event:
  up.on('batch', operations => {
    // FIXME: probably not the right place for selection handling
    const removals = operations.filter(({ type }) => type === 'del').map(({ key }) => key)
    this.selection_.deselect(removals)

    this.emit('batch', { operations })
  })

  this.undo_ = undo
  this.selection_ = selection

  this.compositeCommand = compositeCommand.bind(this)
  this.deleteCommand = deleteCommand.bind(this)
  this.insertCommand = insertCommand.bind(this)
  this.updateCommand = updateCommand.bind(this)

  window.requestIdleCallback(async () => {
    // Delete symbols to refresh after updating 2525c.json:
    // const keys = await this.db_.keys('symbol:')
    // const ops = keys.map(key => ({ type: 'del', key }))
    // await this.db_.batch(ops)

    const alreadyImported = await this.db_.existsKey('symbol:')
    if (!alreadyImported) await importSymbols(this.db_)
  }, { timeout: 2000 })

}

util.inherits(Store, Emitter)


/**
 * @async
 * selectFeatures :: GeoJSON/Feature a => () -> [a]
 */
Store.prototype.selectFeatures = function (keys) {
  const arg = keys || 'feature:'
  return this.db_.values(arg)
}

/**
 * @async
 * selectProperties :: Key k, Value v => k => [v]
 * selectProperties :: Key k, Value v => [k] => [v]
 */
Store.prototype.selectProperties = function (keys) {
  return this.properties_.values(keys)
}


/**
 * @async
 * selectGeometries :: Key k => k -> [GeoJSON/Geometry]
 * selectGeometries :: Key k => [k] -> [GeoJSON/Geometry]
 */
Store.prototype.selectGeometries = function (arg) {
  if (Array.isArray(arg)) return this.geometries_.values(arg)
  else if (isLayerId(arg)) return this.geometries_.values(`feature:${arg.split(':')[1]}`)
  else this.geometries_.values([arg])
}


/**
 * @async
 * collectKeys_ :: Key k => [k] -> [k]
 */
Store.prototype.collectKeys_ = async function (ids, excludes = []) {
  const featureIds = id => this.properties_.keys(`feature:${layerUUID(id)}`)

  const linkIds = id => {
    if (!excludes.includes('link')) return this.properties_.keys(`link+${id}`)
    else return []
  }


  const collect = (acc, ids) => {
    acc.push(...ids)

    return ids.reduce(async (acc, id) => {
      const xs = await acc
      const ys = []

      if (isLayerId(id) || isFeatureId(id)) ys.push(...await linkIds(id))
      if (isLayerId(id)) ys.push(...await featureIds(id))

      await collect(xs, ys)
      return xs
    }, acc)
  }

  return R.uniq(await collect([], ids))
}


/**
 * @async
 * update_ :: Key k, Value v => (v -> v, [k]) -> unit
 */
Store.prototype.update_ = async function (fn, keys) {
  const values = await this.db_.values(keys)
  const ops = values.map(value => ({ type: 'put', key: value.id, value: fn(value) }))
  return this.db_.batch(ops)
}


/**
 * @async
 * select :: Key k, Value v => k => [v]
 * select :: Key k, Value v => [k] => [v]
 */
Store.prototype.select = function (ids) {
  return this.db_.values(ids)
}


/**
 * @asnyc
 * entries :: Prefix p, Key k, Value v => p -> {k: v}
 * entries :: Key k, Value v => [k] -> {k: v}
 */
Store.prototype.entries = function (prefix) {
  return this.properties_.entries(prefix)
}


/**
 * @asnyc
 * keys :: Prefix p, Key k => p -> [k]
 */
Store.prototype.keys = function (prefix) {
  return this.properties_.keys(prefix)
}


const deletable = id => !isSymbolId(id)

/**
 * @async
 * delete :: Key k => [k] -> unit
 */
Store.prototype.delete = async function (ids) {
  const keys = await this.collectKeys_(ids.filter(deletable))
  const values = await this.db_.values(keys)
  this.undo_.apply(this.deleteCommand(values))
}


/**
 * @async
 * insert :: Value v => [v] -> unit
 */
Store.prototype.insert = async function (values) {
  this.undo_.apply(this.insertCommand(values))
}


/**
 * @async
 * update :: Value v => [v] -> unit
 * update :: Value v => ([v], [v]) -> unit
 */
Store.prototype.update = function (newValues, oldValues) {
  if (!newValues.length) return
  if (oldValues) this.undo_.apply(this.updateCommand(newValues, oldValues))
  else this.db_.batch(newValues.map(value => ({ type: 'put', key: value.id, value })))
}


/**
 * @async
 * insertFeatures :: GeoJSON/Feature a => [a] -> unit
 *
 * Features without identifier are assigned to default layer.
 * Default layer is created as necessary.
 * Features with identity remain unchanged.
 */
Store.prototype.insertFeatures = async function (features) {
  const values = []
  const [keep, assign] = R.partition(R.prop('id'), features)
  values.push(...keep)

  if (assign.length) {
    // Get or create default layer:
    const layer = await (async () => {
      const layers = await this.db_.values('layer:')
      const defaultLayer = layers.find(layer => (layer.tags || []).includes('default'))
      if (defaultLayer) return defaultLayer
      else {
        const id = `layer:${uuid()}`
        const layer = { id, name: 'Default Layer', tags: ['default'] }
        values.push(layer)
        return layer
      }
    })()

    const assignId = R.tap(feature => (feature.id = featureId(layer.id)))
    values.push(...assign.map(assignId))
  }

  this.undo_.apply(this.insertCommand(values))
}


/**
 * @async
 * rename :: Key k, Name n => (k, n) -> unit
 */
Store.prototype.rename = async function (id, name) {
  const oldValue = await this.properties_.get(id)
  const newValue = { ...oldValue, name }
  const command = this.updateCommand([newValue], [oldValue])
  this.undo_.apply(command)
}


// taggable :: Key k => k -> boolean
const taggable = id => !isGroupId(id)

// addTag :: Name n, Value v => n -> v -> v
const addTag = name => value => ({
  ...value,
  tags: R.uniq([...(value.tags || []), name])
})

// removeTag :: Name a, Value b => n -> v -> v
const removeTag = name => value => ({
  ...value,
  tags: (value.tags || []).filter(tag => tag !== name)
})


/**
 * @async
 * addTag :: (Key k, Name n) => (k, n) -> unit
 */
Store.prototype.addTag = async function (id, name) {
  const add = addTag(name)
  const remove = removeTag(name)

  const [newValues, oldValues] = await (async () => {

    // 'default' tag can only by applied to a single layer.
    if (name === 'default' && isLayerId(id)) {
      const layers = await this.db_.entries('layer:')
      const oldValues = []
      const newValues = []

      // Add tag to new default layer.
      const layer = layers[id]
      oldValues.push(layer)
      newValues.push(add(layer))

      // Remove tag from current default layer (if any).
      Object.values(layers)
        .filter(layer => (layer.tags || []).includes('default'))
        .forEach(layer => {
          oldValues.push(layer)
          newValues.push(remove(layer))
        })

      return [newValues, oldValues]
    }

    const ids = R.uniq([id, ...this.selection_.selected(taggable)])
    const oldValues = await this.db_.values(ids)
    const newValues = oldValues.map(add)
    return [newValues, oldValues]
  })()

  this.undo_.apply(this.updateCommand(newValues, oldValues))
}


/**
 * @async
 * removeTag :: (Key k, Name n) => (k, n) -> unit
 */
Store.prototype.removeTag = async function (id, name) {
  const ids = R.uniq([id, ...this.selection_.selected(taggable)])
  const oldValues = await this.db_.values(ids)
  const newValues = oldValues.map(removeTag(name))
  this.undo_.apply(this.updateCommand(newValues, oldValues))
}

// TODO: extract duplicate code: show, hide, lock, unlock

/**
 * @async
 * hide :: Key k => k -> unit
 */
Store.prototype.hide = async function (id, active) {
  if (active !== undefined) return
  // const hide = R.tap(value => { value.hidden = true })
  const ids = R.uniq([id, ...this.selection_.selected()])
  const keys = await this.collectKeys_(ids, ['link'])
  // await this.update_(hide, keys)

  const ops = keys.map(key => ({ type: 'put', key: `hidden+${key}`, value: true }))
  return this.db_.batch(ops)
}


/**
 * @sync
 * show :: Key k => k -> unit
 */
Store.prototype.show = async function (id, active) {
  if (active !== undefined) return
  // const show = R.tap(value => { delete value.hidden })
  const ids = R.uniq([id, ...this.selection_.selected()])
  const keys = await this.collectKeys_(ids, ['link'])
  // await this.update_(show, keys)

  const ops = keys.map(key => ({ type: 'del', key: `hidden+${key}` }))
  return this.db_.batch(ops)
}


/**
 * @async
 * lock :: Key k => k -> unit
 */
Store.prototype.lock = async function (id, active) {
  if (active !== undefined) return
  // const lock = R.tap(value => { value.locked = true })
  const ids = R.uniq([id, ...this.selection_.selected()])
  const keys = await this.collectKeys_(ids, ['link'])
  // await this.update_(lock, keys)

  const ops = keys.map(key => ({ type: 'put', key: `locked+${key}`, value: true }))
  return this.db_.batch(ops)
}


/**
 * @sync
 * unlock :: Key k => k -> unit
 */
Store.prototype.unlock = async function (id, active) {
  if (active !== undefined) return
  // const unlock = R.tap(value => { delete value.locked })
  const ids = R.uniq([id, ...this.selection_.selected()])
  const keys = await this.collectKeys_(ids, ['link'])
  // await this.update_(unlock, keys)

  const ops = keys.map(key => ({ type: 'del', key: `locked+${key}` }))
  return this.db_.batch(ops)
}


/**
 * compositeCommand :: Command a => [a] -> a
 */
const compositeCommand = async function (commands) {
  const resolved = await Promise.all(commands)
  return {
    apply: () => Promise.all(resolved.map(command => command.apply())),
    inverse: () => this.compositeCommand(resolved.reverse().map(command => command.inverse()))
  }
}


/**
 * insertCommand :: Value v => [v] -> Command
 */
const insertCommand = function (values) {
  const ops = values.map(value => ({ type: 'put', key: value.id, value }))
  return {
    apply: () => this.db_.batch(ops),
    inverse: () => this.deleteCommand(values)
  }
}


/**
 * deleteCommand :: Value v => [v] -> Command
 */
const deleteCommand = function (values) {
  const ops = values.map(({ id: key }) => ({ type: 'del', key }))
  return {
    apply: () => this.db_.batch(ops),
    inverse: () => this.insertCommand(values)
  }
}


/**
 * updateCommand :: Value v => ([v], [v]) -> Command
 */
const updateCommand = function (newValues, oldValues) {
  const ops = newValues.map(value => ({ type: 'put', key: value.id, value }))
  return {
    apply: () => this.db_.batch(ops),
    inverse: () => this.updateCommand(oldValues, newValues)
  }
}
