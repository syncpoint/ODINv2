import util from 'util'
import * as R from 'ramda'
import Emitter from '../../shared/emitter'
import { writeGeometryObject } from './format'
import { isFeatureId, isGroupId } from '../ids'



/**
 * @constructor
 * @param {LevelUp} propertiesLevel properties database.
 * @param {LevelUp} geometryLevel geometry database.
 * @param {Undo} undo
 * @param {Selection} selection
 *
 * @emits features/batch - complete features (properties and geometries)
 * @emits feature/properties - feature properties only
 * @emits feature/geometries - feature geometries only
 *
 * MANIFEST
 * entries_ :: db -> { string -> object } - all entries
 * entries_ :: db -> string -> { string -> object } - entries with common id prefix
 * entries_ :: db -> [string] -> { string -> object } - entries by id (random access)
 * values_ :: db -> [object] - all values
 * values_ :: db -> string -> [object] - values with common id prefix
 * values_ :: db -> [string] -> [object] - values by id (random access)
 * keys_ :: db -> string -> [string]
 * featureProperties :: () -> { string -> object } - all features properties
 * featureProperties :: string -> { string -> object } - features properties by layer
 * featureProperties :: [string] -> { string -> object } - features properties by id
 * featureGeometries :: () -> { string -> object } - all features geometries
 * featureGeometries :: string -> { string -> object } - features geometries by layer id
 * featureGeometries :: [string] -> { string -> object } - features geometries by id
 * getFeatures :: () -> [GeoJSON/Feature]
 * getFeatures :: string -> [GeoJSON/Feature]
 * getFeatures :: [string] -> [GeoJSON/Feature]
 * getValue :: string -> object
 * getValues :: [string] -> [object]
 * importLayer :: [GeoJSON/Layer] -> unit
 * putFeatures_ :: [GeoJSON/Feature] -> unit
 * putLayer :: GeoJSON/Layer -> unit
 * putFeatures :: [GeoJSON/Feature] -> unit
 * deleteFeatures :: [string] -> unit
 * deleteLayer :: string -> unit
 * updateGeometries :: { id -> [new, old] } -> unit
 * del :: [string] -> unit
 * addTag :: string -> string -> unit
 * removeTag :: string -> string -> unit
 * replaceValues_ :: [object] -> unit
 * replaceValues :: [object] -> [object] -> unit
 * rename :: string -> string -> unit
 * compositeCommand :: [Command] -> Command
 * importLayersCommand :: [GeoJSON/Layer] -> Command
 * putLayerCommand :: GeoJSON/Layer -> Command
 * deleteLayerCommand :: GeoJSON/Layer -> Command
 * updateGeometriesCommand :: { string -> [new, old] } -> Command
 * deleteFeaturesCommand :: [JSON/feature] -> Command
 * putFeaturesCommand :: [JSON/feature] -> Command
 * addTagCommand :: [string] -> string -> Command
 * removeTagCommand :: [string] -> string -> Command
 * replaceValuesCommand :: [object] -> [object] -> Command
 */
export function LayerStore (propertiesLevel, geometryLevel, undo, selection) {
  Emitter.call(this)

  this.properties_ = propertiesLevel
  this.geometries_ = geometryLevel
  this.undo_ = undo
  this.selection_ = selection

  // Geometries deletes are ignored. They can be handled on 'features/batch' event.
  this.geometries_.on('batch', event => {
    const operations = event.filter(({ type }) => type === 'put')
    if (operations.length) this.emit('features/geometries', { operations: event })
  })

  // Properties deletes are ignored. They can be handled on 'features/batch' event.
  this.properties_.on('batch', event => {
    const operations = event
      .filter(({ key }) => isFeatureId(key))
      .filter(({ type }) => type === 'put')

    if (operations.length) this.emit('features/properties', { operations })
  })

  this.compositeCommand = compositeCommand.bind(this)
  this.importLayersCommand = importLayersCommand.bind(this)
  this.putLayerCommand = putLayerCommand.bind(this)
  this.deleteLayerCommand = deleteLayerCommand.bind(this)
  this.updateGeometriesCommand = updateGeometriesCommand.bind(this)
  this.deleteFeaturesCommand = deleteFeaturesCommand.bind(this)
  this.putFeaturesCommand = putFeaturesCommand.bind(this)
  this.addTagCommand = addTagCommand.bind(this)
  this.removeTagCommand = removeTagCommand.bind(this)
  this.replaceValuesCommand = replaceValuesCommand.bind(this)
}

util.inherits(LayerStore, Emitter)


/**
 * @async
 * entries_ :: db -> { string -> object } - all entries
 * entries_ :: db -> string -> { string -> object } - entries with common id prefix
 * entries_ :: db -> [string] -> { string -> object } - entries by id (random access)
 */
LayerStore.prototype.entries_ = function (db, arg) {
  if (Array.isArray(arg)) {
    return arg.reduce(async (acc, id) => {
      const xs = await acc
      xs[id] = await db.get(id)
      return xs
    }, {})
  }

  return new Promise((resolve, reject) => {
    const acc = {}

    const options = arg
      ? { keys: true, values: true, gte: arg, lte: arg + '\xff' }
      : { keys: true, values: true }

    db.createReadStream(options)
      .on('data', ({ key, value }) => (acc[key] = value))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * @async
 * values_ :: db -> [object] - all values
 * values_ :: db -> string -> [object] - values with common id prefix
 * values_ :: db -> [string] -> [object] - values by id (random access)
 */
LayerStore.prototype.values_ = function (db, arg) {
  if (Array.isArray(arg)) {
    return arg.reduce(async (acc, id) => {
      const xs = await acc
      xs.push(await db.get(id))
      return xs
    }, [])
  }

  return new Promise((resolve, reject) => {
    const acc = []

    const options = arg
      ? { keys: false, values: true, gte: arg, lte: arg + '\xff' }
      : { keys: false, values: true }

    db.createReadStream(options)
      .on('data', value => (acc.push(value)))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * @async
 * keys_ :: db -> string -> [string]
 */
LayerStore.prototype.keys_ = function (db, prefix) {
  return new Promise((resolve, reject) => {
    const acc = []
    const options = { keys: true, values: false, gte: prefix, lte: prefix + '\xff' }

    db.createReadStream(options)
      .on('data', key => acc.push(key))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * @async
 * featureProperties :: () -> { string -> object } - all features properties
 * featureProperties :: string -> { string -> object } - features properties by layer
 * featureProperties :: [string] -> { string -> object } - features properties by id
 *
 * NOTE: Not only `properties` are stored, but also `id` on the same level,
 *       i.e. { id, properties }
 */
LayerStore.prototype.featureProperties = function (arg) {
  if (Array.isArray(arg)) return this.entries_(this.properties_, arg)
  else {
    const prefix = arg ? `feature:${arg.split(':')[1]}` : 'feature:'
    return this.entries_(this.properties_, prefix)
  }
}


/**
 * @async
 * featureGeometries :: () -> { string -> object } - all features geometries
 * featureGeometries :: string -> { string -> object } - features geometries by layer id
 * featureGeometries :: [string] -> { string -> object } - features geometries by id
 */
LayerStore.prototype.featureGeometries = function (arg) {
  if (Array.isArray(arg)) return this.entries_(this.geometries_, arg)
  else {
    const prefix = arg ? `feature:${arg.split(':')[1]}` : 'feature:'
    return this.entries_(this.geometries_, prefix)
  }
}


/**
 * @async
 * getFeatures :: () -> [GeoJSON/Feature]
 * getFeatures :: string -> [GeoJSON/Feature]
 * getFeatures :: [string] -> [GeoJSON/Feature]
 */
LayerStore.prototype.getFeatures = async function (arg) {
  const properties = await this.featureProperties(arg)
  const geometries = await this.featureGeometries(arg)
  return Object.values(properties).map(feature => ({
    type: 'Feature',
    ...feature,
    geometry: geometries[feature.id]
  }))
}


/**
 * @async
 * getValue :: string -> object
 */
LayerStore.prototype.getValue = function (id) {
  return this.properties_.get(id)
}


/**
 * @async
 * getValues :: [string] -> [object]
 */
LayerStore.prototype.getValues = function (ids) {
  return this.values_(this.properties_, ids)
}


/**
 * @async
 * importLayer :: [GeoJSON/Layer] -> unit
 */
LayerStore.prototype.importLayers = async function (layers) {
  const command = await this.importLayersCommand(layers)
  this.undo_.apply(command)
}


/**
 * @async
 * putFeatures_ :: [GeoJSON/Feature] -> unit
 */
LayerStore.prototype.putFeatures_ = async function (features) {

  await (async () => {
    const ops = features.map(feature => ({
      type: 'put',
      key: feature.id,
      value: feature.geometry
    }))

    return this.geometries_.batch(ops)
  })()

  await (async () => {
    const ops = features.map(feature => {
      // Note: We keep type: 'Feature' form GeoJSON.
      const copy = { ...feature }
      delete copy.geometry // Don't write geometry property as JSON.

      return {
        type: 'put',
        key: copy.id,
        value: copy
      }
    })

    return this.properties_.batch(ops)
  })()

  const operations = features.map(value => ({ type: 'put', key: value.id, value }))
  this.emit('features/batch', { operations })
}


/**
 * @async
 * putLayer :: GeoJSON/Layer -> unit
 */
LayerStore.prototype.putLayer = async function (layer) {
  const { id, name, features } = layer
  await this.properties_.batch([{
    type: 'put', key: id, value: { name, id }
  }])

  this.putFeatures_(features)
}


/**
 * @async
 * putFeatures :: [GeoJSON/Feature] -> unit
 */
LayerStore.prototype.putFeatures = function (features) {
  const command = this.putFeaturesCommand(features)
  return this.undo_.apply(command)
}


/**
 * @async
 * deleteFeatures :: [string] -> unit
 */
LayerStore.prototype.deleteFeatures = async function (ids) {
  const operations = ids.map(key => ({ type: 'del', key }))
  await this.properties_.batch(operations)
  await this.geometries_.batch(operations)
  this.emit('features/batch', { operations })
}


/**
 * @async
 * deleteLayer :: string -> unit
 */
LayerStore.prototype.deleteLayer = async function (layerId) {
  await this.properties_.del(layerId)

  const op = key => ({ type: 'del', key })
  const layerUUID = layerId.split(':')[1]
  const keys = await this.keys_(this.properties_, `feature:${layerUUID}`)
  const operations = keys.map(op)
  await this.properties_.batch(operations)
  await this.geometries_.batch(operations)
  this.emit('features/batch', { operations })
}


/**
 * @async
 * updateGeometries :: { id -> [new, old] } -> unit
 */
LayerStore.prototype.updateGeometries = async function (geometries) {
  const command = this.updateGeometriesCommand(geometries)
  this.undo_.apply(command)
}


/**
 * @async
 * del :: [string] -> unit
 */
LayerStore.prototype.del = async function (ids) {
  // TODO: undo
  // TODO: support all scopes
  // TODO: recursively delete all dependencies

  const featureIds = ids.filter(id => isFeatureId(id))
  const features = await this.getFeatures(featureIds)
  const command = this.deleteFeaturesCommand(features)
  this.undo_.apply(command)
}

const taggable = id => !isGroupId(id)

/**
 * addTag :: string -> string -> unit
 */
LayerStore.prototype.addTag = function (id, name) {
  // TODO: special handling - default layer
  const ids = R.uniq([id, ...this.selection_.selected(taggable)])
  const command = this.addTagCommand(ids, name)
  this.undo_.apply(command)
}


/**
 * removeTag :: string -> string -> unit
 */
LayerStore.prototype.removeTag = function (id, name) {
  const ids = R.uniq([id, ...this.selection_.selected(taggable)])
  const command = this.removeTagCommand(ids, name)
  this.undo_.apply(command)
}


/**
 * @async
 * replaceValues_ :: [object] -> unit
 */
LayerStore.prototype.replaceValues_ = function (values) {
  return this.properties_.batch(values.map(value => ({
    type: 'put',
    key: value.id,
    value: value
  })))
}


/**
 * @async
 * replaceValues :: [object] -> [object] -> unit
 */
LayerStore.prototype.replaceValues = function (newValues, oldvalues) {
  // No undo when oldProperties not provided.
  if (!oldvalues) return this.replaceValues_(newValues)
  else {
    const command = this.replaceValuesCommand(newValues, oldvalues)
    this.undo_.apply(command)
  }
}


/**
 * @async
 * rename :: string -> string -> unit
 */
LayerStore.prototype.rename = async function (id, name) {
  const oldValue = await this.properties_.get(id)
  const newValue = { ...oldValue, name }
  const command = this.replaceValuesCommand([newValue], [oldValue])
  this.undo_.apply(command)
}


/**
 * compositeCommand :: [Command] -> Command
 */
const compositeCommand = async function (commands) {
  const resolved = await Promise.all(commands)
  return {
    apply: () => Promise.all(resolved.map(command => command.apply())),
    inverse: () => this.compositeCommand(resolved.reverse().map(command => command.inverse()))
  }
}


/**
 * importLayersCommand :: [GeoJSON/Layer] -> Command
 */
const importLayersCommand = function (layers) {
  return this.compositeCommand(layers.map(layer => this.putLayerCommand(layer)))
}


/**
 * putLayerCommand :: GeoJSON/Layer -> Command
 */
const putLayerCommand = function (layer) {
  return {
    apply: () => this.putLayer(layer),
    inverse: () => this.deleteLayerCommand(layer)
  }
}


/**
 * @async
 * deleteLayerCommand :: GeoJSON/Layer -> Command
 */
const deleteLayerCommand = async function (layer) {
  return {
    apply: () => this.deleteLayer(layer.id),
    inverse: () => this.putLayerCommand(layer)
  }
}


/**
 * updateGeometriesCommand :: { string -> [new, old] } -> Command
 */
const updateGeometriesCommand = function (geometries) {
  const entries = Object.entries(geometries).map(([id, xs]) => [id, [xs[1], xs[0]]])
  const switchedGeometries = Object.fromEntries(entries)
  return {
    apply: async () => {
      const operations = Object.entries(geometries)
        .map(([key, xs]) => [key, writeGeometryObject(xs[0])])
        .map(([key, value]) => ({ type: 'put', key, value }))

      return await this.geometries_.batch(operations)
    },
    inverse: () => this.updateGeometriesCommand(switchedGeometries)
  }
}


/**
 * deleteFeaturesCommand :: [JSON/feature] -> Command
 */
const deleteFeaturesCommand = function (features) {
  const ids = features.map(feature => feature.id)
  return {
    apply: () => this.deleteFeatures(ids),
    inverse: () => this.putFeaturesCommand(features)
  }
}


/**
 * putFeaturesCommand :: [JSON/feature] -> Command
 */
const putFeaturesCommand = function (features) {
  return {
    apply: async () => this.putFeatures_(features),
    inverse: () => this.deleteFeaturesCommand(features)
  }
}

const addTag = name => item => (item.tags = R.uniq([...(item.tags || []), name]))
const removeTag = name => item => (item.tags = (item.tags || []).filter(tag => tag !== name))


/**
 * addTagCommand :: [string] -> string -> Command
 */
const addTagCommand = function (ids, name) {
  return {
    apply: async () => {
      const items = await this.getValues(ids)
      const ops = items
        .map(R.tap(addTag(name)))
        .reduce((acc, item) => acc.concat({ type: 'put', key: item.id, value: item }), [])

      this.properties_.batch(ops)
    },
    inverse: () => this.removeTagCommand(ids, name)
  }
}


/**
 * removeTagCommand :: [string] -> string -> Command
 */
const removeTagCommand = function (ids, name) {
  return {
    apply: async () => {
      const items = await this.getValues(ids)
      const ops = items
        .map(R.tap(removeTag(name)))
        .reduce((acc, item) => acc.concat({ type: 'put', key: item.id, value: item }), [])

      this.properties_.batch(ops)
    },
    inverse: () => this.addTagCommand(ids, name)
  }
}


/**
 * replaceValuesCommand :: [object] -> [object] -> Command
 */
const replaceValuesCommand = function (newValues, oldValues) {
  return {
    apply: () => this.replaceValues_(newValues),
    inverse: () => this.replaceValuesCommand(oldValues, newValues)
  }
}
