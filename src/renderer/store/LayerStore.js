import util from 'util'
import Emitter from '../../shared/emitter'
import { writeGeometryObject } from './format'
import { compositeCommand } from './store-common'


/**
 *
 */
const putLayer = function (layer) {
  return {
    apply: () => this.putLayer(layer),
    inverse: () => this.commands.deleteLayer(layer.id)
  }
}


/**
 *
 */
const importLayers = function (layers) {
  return compositeCommand(layers.map(this.commands.putLayer))
}


/**
 *
 */
const deleteLayer = async function (layerId) {
  const layer = {
    ...await this.getFeatures(layerId),
    ...await this.propertiesLevel_.get(layerId)
  }

  return {
    apply: () => this.deleteLayer(layerId),
    inverse: () => this.commands.putLayer(layer)
  }
}


/**
 *
 */
const updateGeometries = function (oldGeometries, newGeometries) {
  return {
    apply: () => this.updateGeometries(newGeometries),
    inverse: () => this.commands.updateGeometries(newGeometries, oldGeometries)
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
 * @constructor
 * @param {LevelUp} propertiesLevel properties database.
 * @param {LevelUp} geometryLevel geometry database.
 */
export function LayerStore (propertiesLevel, geometryLevel) {
  Emitter.call(this)

  this.propertiesLevel_ = propertiesLevel
  this.geometryLevel_ = geometryLevel

  this.commands = {}
  this.commands.putLayer = putLayer.bind(this)
  this.commands.importLayers = importLayers.bind(this)
  this.commands.deleteLayer = deleteLayer.bind(this)
  this.commands.updateGeometries = updateGeometries.bind(this)
  this.commands.updateEntries = updateEntries.bind(this)
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
LayerStore.prototype.featureProperties = function (layerId) {
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
LayerStore.prototype.featuerGeometries = function (layerId) {
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
LayerStore.prototype.keys = function (store, prefix) {
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
  const properties = await this.featureProperties(layerId)
  const geometries = await this.featuerGeometries(layerId)
  const features = Object.values(properties).map(feature => ({
    type: 'Feature',
    ...feature,
    geometry: geometries[feature.id]
  }))

  return { type: 'FeatureCollection', features }
}


/**
 *
 */
LayerStore.prototype.getEntry = function (id) {
  return this.propertiesLevel_.get(id)
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


LayerStore.prototype.putLayer = async function (layer) {
  const { id, name, features } = layer
  await this.propertiesLevel_.put(id, { name, id })

  await this.propertiesLevel_.batch(features.map(feature => ({
    type: 'put',
    key: feature.id,
    value: feature
  })))

  await this.geometryLevel_.batch(features.map(feature => ({
    type: 'put',
    key: feature.id,
    value: feature.geometry
  })))

  this.emit('batch', {
    operations: features.map(feature => ({
      type: 'put',
      key: feature.id,
      value: feature
    }))
  })
}

LayerStore.prototype.deleteLayer = async function (layerId) {
  await this.propertiesLevel_.del(layerId)
  const op = key => ({ type: 'del', key })
  const layerUUID = layerId.split(':')[1]
  const keys = await this.keys(this.propertiesLevel_, `feature:${layerUUID}`)
  const operations = keys.map(op)
  await this.propertiesLevel_.batch(operations)
  await this.geometryLevel_.batch(operations)
  this.emit('batch', { operations })
}

LayerStore.prototype.updateGeometries = async function (geometries) {
  const ops = Object.entries(geometries)
    .map(([key, value]) => [key, writeGeometryObject(value)])
    .map(([key, value]) => ({ type: 'put', key, value }))

  this.emit('geometries', { operations: ops })
  return this.geometryLevel_.batch(ops)
}
