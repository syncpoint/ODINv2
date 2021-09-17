import util from 'util'
import * as R from 'ramda'
import uuid from 'uuid-random'
import Emitter from '../../shared/emitter'
import { writeGeometryObject } from './format'
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
 *
 * MANIFEST
 * collectKeys_ :: Id a => [a] -> [a]
 * update_ :: (Value a, Id b) => (a -> a, [b]) -> unit
 *
 * selectFeatures :: GeoJSON/Feature a => () -> [a]
 * updateGeometries :: (Id k, GeoJSON/Geometry a) => {k: [a, a]} -> unit
 * delete :: Id a => [a] -> unit
 * insert :: Value a => [a] -> unit
 * update :: Value a => [a] -> unit
 * update :: Value a => ([a], [a]) -> unit
 * insertFeatures :: GeoJSON/Feature a => [a] -> unit
 * rename :: (Id a, Name b) => (a, b) -> unit
 * addTag :: (Id a, Name b) => (a, b) -> unit
 * removeTag :: (Id a, Name b) => (a, b) -> unit
 * hide :: (Id a) => a -> unit
 * show :: (Id a) => a -> unit
 * identify :: (Id a) => a -> unit
 *
 * compositeCommand :: Command a => [a] -> a
 * insertCommand :: Value a => [a] -> Command
 * deleteCommand :: Value a => [a] -> Command
 * updateCommand :: Value a => ([a], [a]) -> Command
 * updateGeometriesCommand :: (Id k, GeoJSON/Geometry a) => {k: [a, a]} -> Command
 */
export function Store (propertiesLevel, geometryLevel, undo, selection) {
  Emitter.call(this)

  this.properties_ = new HighLevel(propertiesLevel)
  this.geometries_ = new HighLevel(geometryLevel)
  const down = new PartitionDOWN(propertiesLevel, geometryLevel)
  const up = leveldb({ down })
  this.db_ = new HighLevel(up)

  this.undo_ = undo
  this.selection_ = selection

  // Geometries deletes are ignored. They can be handled on 'features/batch' event.
  geometryLevel.on('batch', event => {
    const operations = event.filter(({ type }) => type === 'put')
    if (operations.length) this.emit('features/geometries', { operations })
  })

  propertiesLevel.on('batch', event => {
    const operations = event.filter(({ key }) => isFeatureId(key))
    if (operations.length) this.emit('features/properties', { operations })
  })

  this.compositeCommand = compositeCommand.bind(this)
  this.deleteCommand = deleteCommand.bind(this)
  this.insertCommand = insertCommand.bind(this)
  this.updateCommand = updateCommand.bind(this)
  this.updateGeometriesCommand = updateGeometriesCommand.bind(this)

  window.requestIdleCallback(async () => {
    const alreadyImported = await this.db_.existsKey('symbol:')
    if (!alreadyImported) await importSymbols(this.properties_)
  }, { timeout: 2000 })

}

util.inherits(Store, Emitter)


/**
 * @async
 * selectFeatures :: GeoJSON/Feature a => () -> [a]
 */
Store.prototype.selectFeatures = function () {
  return this.db_.values('feature:')
}


/**
 * @async
 * updateGeometries :: (Id k, GeoJSON/Geometry a) => {k: [a, a]} -> unit
 */
Store.prototype.updateGeometries = async function (geometries) {

  // Rewrite keys from 'feature:' to special 'geometry:' to
  // directly write feature geometries.

  const entries = Object.entries(geometries).reduce((acc, [key, value]) => {
    acc[`geometry:${key.split(':')[1]}`] = value
    return acc
  }, {})

  this.undo_.apply(this.updateGeometriesCommand(entries))
}


/**
 * @async
 * collectKeys_ :: Id a => [a] -> [a]
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
 * update_ :: (Value a, Id b) => (a -> a, [b]) -> unit
 */
Store.prototype.update_ = async function (fn, keys) {
  const values = await this.db_.values(keys)
  const ops = values.map(value => ({ type: 'put', key: value.id, value: fn(value) }))
  return this.properties_.batch(ops)
}


/**
 * @async
 * select :: (Id a, Value b) => [a] => [b]
 */
Store.prototype.select = function (ids) {
  return this.db_.values(ids)
}


const deletable = id => !isSymbolId(id)

/**
 * @async
 * delete :: Id a => [a] -> unit
 */
Store.prototype.delete = async function (ids) {
  const keys = await this.collectKeys_(ids.filter(deletable))
  const values = await this.db_.values(keys)
  this.undo_.apply(this.deleteCommand(values))
}


/**
 * @async
 * insert :: Value a => [a] -> unit
 */
Store.prototype.insert = async function (values) {
  this.undo_.apply(this.insertCommand(values))
}


/**
 * @async
 * update :: Value a => [a] -> unit
 * update :: Value a => ([a], [a]) -> unit
 */
Store.prototype.update = function (newValues, oldValues) {
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
 * rename :: (Id a, Name b) => (a, b) -> unit
 */
Store.prototype.rename = async function (id, name) {
  const oldValue = await this.properties_.get(id)
  const newValue = { ...oldValue, name }
  const command = this.updateCommand([newValue], [oldValue])
  this.undo_.apply(command)
}


// taggable :: Id a => a -> boolean
const taggable = id => !isGroupId(id)

// addTag :: (Name a, Value b) => a -> b -> b
const addTag = name => value => ({
  ...value,
  tags: R.uniq([...(value.tags || []), name])
})

// removeTag :: (Name a, Value b) => a -> b -> b
const removeTag = name => value => ({
  ...value,
  tags: (value.tags || []).filter(tag => tag !== name)
})


/**
 * @async
 * addTag :: (Id a, Name b) => (a, b) -> unit
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
 * removeTag :: (Id a, Name b) => (a, b) -> unit
 */
Store.prototype.removeTag = async function (id, name) {
  const ids = R.uniq([id, ...this.selection_.selected(taggable)])
  const oldValues = await this.db_.values(ids)
  const newValues = oldValues.map(removeTag(name))
  this.undo_.apply(this.updateCommand(newValues, oldValues))
}


/**
 * @async
 * hide :: (Id a) => a -> unit
 */
Store.prototype.hide = async function (id) {
  const hide = R.tap(value => { value.hidden = true })
  const ids = R.uniq([id, ...this.selection_.selected()])
  const keys = await this.collectKeys_(ids, ['link'])
  return this.update_(hide, keys)
}


/**
 * @sync
 * show :: (Id a) => a -> unit
 */
Store.prototype.show = async function (id) {
  const show = R.tap(value => { delete value.hidden })
  const ids = R.uniq([id, ...this.selection_.selected()])
  const keys = await this.collectKeys_(ids, ['link'])
  return this.update_(show, keys)
}


/**
 * @async
 * identify :: (Id a) => a -> unit
 */
Store.prototype.identify = async function (id) {
  const ids = R.uniq([id, ...this.selection_.selected()])
  console.log('[Store] identitfy', ids)
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
 * insertCommand :: Value a => [a] -> Command
 */
const insertCommand = function (values) {
  const ops = values.map(value => ({ type: 'put', key: value.id, value }))
  return {
    apply: () => this.db_.batch(ops),
    inverse: () => this.deleteCommand(values)
  }
}


/**
 * deleteCommand :: Value a => [a] -> Command
 */
const deleteCommand = function (values) {
  const ops = values.map(({ id: key }) => ({ type: 'del', key }))
  return {
    apply: () => this.db_.batch(ops),
    inverse: () => this.insertCommand(values)
  }
}


/**
 * updateCommand :: Value a => ([a], [a]) -> Command
 */
const updateCommand = function (newValues, oldValues) {
  const ops = newValues.map(value => ({ type: 'put', key: value.id, value }))
  return {
    apply: () => this.db_.batch(ops),
    inverse: () => this.updateCommand(oldValues, newValues)
  }
}


/**
 * updateGeometriesCommand :: (Id k, GeoJSON/Geometry a) => {k: [a, a]} -> Command
 */
const updateGeometriesCommand = function (geometries) {
  const entries = Object.entries(geometries).map(([id, xs]) => [id, [xs[1], xs[0]]])
  const switchedGeometries = Object.fromEntries(entries)
  return {
    apply: async () => {
      const operations = Object.entries(geometries)
        .map(([key, xs]) => [key, writeGeometryObject(xs[0])])
        .map(([key, value]) => ({ type: 'put', key, value }))

      return await this.db_.batch(operations)
    },
    inverse: () => this.updateGeometriesCommand(switchedGeometries)
  }
}
