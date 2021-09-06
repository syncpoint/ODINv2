import util from 'util'
import Emitter from '../../shared/emitter'
import { writeGeometryObject } from './format'


/**
 *
 */
const composite = async function (commands) {
  const resolved = await Promise.all(commands)
  return {
    apply: () => Promise.all(resolved.map(command => command.apply())),
    inverse: () => this.commands.composite(resolved.reverse().map(command => command.inverse()))
  }
}


/**
 *
 */
const importLayers = function (layers) {
  return this.commands.composite(layers.map(this.commands.putLayer))
}


/**
 *
 */
const putLayer = function (layer) {
  return {
    apply: () => this.putLayer(layer),
    inverse: () => this.commands.deleteLayer(layer)
  }
}


/**
 *
 */
const deleteLayer = async function (layer) {
  return {
    apply: () => this.deleteLayer(layer.id),
    inverse: () => this.commands.putLayer(layer)
  }
}


/**
 *
 */
const updateGeometries = function (geometries) {
  const entries = Object.entries(geometries).map(([id, xs]) => [id, [xs[1], xs[0]]])
  const flippedGeometries = Object.fromEntries(entries)
  return {
    apply: () => this.updateGeometries(geometries),
    inverse: () => this.commands.updateGeometries(flippedGeometries)
  }
}


/**
 *
 */
const updateEntries = function (entries, updatedEntries) {
  return {
    apply: () => this.updateEntries(updatedEntries),
    inverse: () => this.commands.updateEntries(updatedEntries, entries)
  }
}


/**
 * putFeatures :: [JSON/feature] -> Command
 */
const putFeatures = function (features) {
  return {
    apply: () => this.putFeatures(features),
    inverse: () => this.commands.deleteFeatures(features)
  }
}


/**
 * deleteFeatures :: [JSON/feature] -> Command
 */
const deleteFeatures = function (features) {
  const ids = features.map(feature => feature.id)
  return {
    apply: () => this.deleteFeatures(ids),
    inverse: () => this.commands.putFeatures(features)
  }
}


/**
 * @constructor
 * @param {LevelUp} propertiesLevel properties database.
 * @param {LevelUp} geometryLevel geometry database.
 */
export function LayerStore (propertiesLevel, geometryLevel) {
  Emitter.call(this)

  this.propertiesLevel_ = propertiesLevel
  this.geometryLevel_ = geometryLevel

  this.commands = {}
  this.commands.composite = composite.bind(this)
  this.commands.putLayer = putLayer.bind(this)
  this.commands.importLayers = importLayers.bind(this)
  this.commands.deleteLayer = deleteLayer.bind(this)
  this.commands.updateGeometries = updateGeometries.bind(this)
  this.commands.updateEntries = updateEntries.bind(this)
  this.commands.putFeatures = putFeatures.bind(this)
  this.commands.deleteFeatures = deleteFeatures.bind(this)
}

util.inherits(LayerStore, Emitter)

/**
 * @private
 * @param {String} layerId optional
 * @returns Feature properties for given layer or all features.
 *
 * NOTE: Not only `properties` are stored, but also `id` on the same level,
 *       i.e. { id, properties }
 */
LayerStore.prototype.featureProperties_ = function (layerId) {
  return new Promise((resolve, reject) => {
    const acc = {}

    const prefix = layerId
      ? `feature:${layerId.split(':')[1]}`
      : 'feature:'

    const options = prefix
      ? { keys: true, values: true, gte: prefix, lte: prefix + '\xff' }
      : { keys: true, values: true }

    this.propertiesLevel_.createReadStream(options)
      .on('data', ({ key, value }) => (acc[key] = value))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * @private
 * @param {String} layerId optional
 * @returns Feature geometries for given layer or all features.
 */
LayerStore.prototype.featureGeometries_ = function (layerId) {
  return new Promise((resolve, reject) => {
    const acc = {}

    const prefix = layerId
      ? `feature:${layerId.split(':')[1]}`
      : 'feature'

    const options = prefix
      ? { keys: true, values: true, gte: prefix, lte: prefix + '\xff' }
      : { keys: true, values: true }

    this.geometryLevel_.createReadStream(options)
      .on('data', ({ key, value }) => (acc[key] = value))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * @private
 */
LayerStore.prototype.keys_ = function (store, prefix) {
  return new Promise((resolve, reject) => {
    const acc = []
    const options = { keys: true, values: false, gte: prefix, lte: prefix + '\xff' }

    store.createReadStream(options)
      .on('data', key => acc.push(key))
      .on('error', reject)
      .on('end', () => resolve(acc))
  })
}


/**
 * @param {String} layerId optional
 * @returns GeoJSON FeatureCollection, i.e. Features for given layer or all features.
 */
LayerStore.prototype.getFeatures = async function (layerId) {
  const properties = await this.featureProperties_(layerId)
  const geometries = await this.featureGeometries_(layerId)
  const features = Object.values(properties).map(feature => ({
    type: 'Feature',
    ...feature,
    geometry: geometries[feature.id]
  }))

  return { type: 'FeatureCollection', features }
}


/**
 * getFeatureProperties :: [string] -> Promise([object])
 */
LayerStore.prototype.getFeatureProperties = function (ids) {
  return ids.reduce(async (acc, id) => {
    const xs = await acc
    xs.push(await this.propertiesLevel_.get(id))
    return xs
  }, [])
}


/**
 * updateEntries :: [entry] -> Promise()
 */
LayerStore.prototype.updateEntries = async function (entries) {
  const operations = entries.map(entry => ({
    type: 'put',
    key: entry.id,
    value: entry
  }))

  await this.propertiesLevel_.batch(operations)
  this.emit('properties', { operations })
}


/**
 * putLayer :: GeoJSON/layer -> Promise()
 */
LayerStore.prototype.putLayer = async function (layer) {
  const { id, name, features } = layer
  await this.propertiesLevel_.batch([{
    type: 'put', key: id, value: { name, id }
  }])

  this.putFeatures(features)
}


/**
 * putFeatures :: [GeoJSON/feature] -> Promise()
 */
LayerStore.prototype.putFeatures = async function (features) {

  // Write geometries first, so we can delete geometry property
  // from properies in next step.
  await (async () => {
    const ops = features.map(feature => ({
      type: 'put',
      key: feature.id,
      value: feature.geometry
    }))

    return this.geometryLevel_.batch(ops)
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

    return this.propertiesLevel_.batch(ops)
  })()

  this.emit('batch', {
    operations: features.map(feature => ({
      type: 'put',
      key: feature.id,
      value: feature
    }))
  })
}


/**
 *
 */
LayerStore.prototype.deleteFeatures = async function (ids) {
  const operations = ids.map(key => ({ type: 'del', key }))
  await this.propertiesLevel_.batch(operations)
  await this.geometryLevel_.batch(operations)
  this.emit('batch', { operations })
}


/**
 *
 */
LayerStore.prototype.deleteLayer = async function (layerId) {
  await this.propertiesLevel_.del(layerId)
  const op = key => ({ type: 'del', key })
  const layerUUID = layerId.split(':')[1]
  const keys = await this.keys_(this.propertiesLevel_, `feature:${layerUUID}`)
  const operations = keys.map(op)
  await this.propertiesLevel_.batch(operations)
  await this.geometryLevel_.batch(operations)
  this.emit('batch', { operations })
}


/**
 * updateGeometries :: { id -> [new, old] } -> Promise()
 */
LayerStore.prototype.updateGeometries = async function (geometries) {
  const operations = Object.entries(geometries)
    .map(([key, xs]) => [key, writeGeometryObject(xs[0])])
    .map(([key, value]) => ({ type: 'put', key, value }))

  this.emit('geometries', { operations })
  return this.geometryLevel_.batch(operations)
}
