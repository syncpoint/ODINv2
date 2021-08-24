import util from 'util'
import Emitter from '../../shared/emitter'
import { writeGeometryObject } from './format'


/**
 * @constructor
 * @param {*} db project database.
 */
export function LayerStore (propertiesStore, geometryStore) {
  Emitter.call(this)

  this.commands = {}
  this.propertiesStore_ = propertiesStore
  this.geometryStore_ = geometryStore

  this.commands.composite = async commands => {
    const resolved = await Promise.all(commands)
    return {
      apply: () => Promise.all(resolved.map(command => command.apply())),
      inverse: () => this.commands.composite(resolved.reverse().map(command => command.inverse()))
    }
  }

  this.commands.importLayers = layers => {
    return this.commands.composite(layers.map(this.commands.putLayer))
  }

  this.commands.putLayer = layer => ({
    apply: () => this.putLayer(layer),
    inverse: () => this.commands.deleteLayer(layer.id)
  })

  this.commands.deleteLayer = async (layerId) => {
    const layer = {
      ...await this.getFeatures(layerId),
      ...await this.propertiesStore_.get(layerId)
    }

    return {
      apply: () => this.deleteLayer(layerId),
      inverse: () => this.commands.putLayer(layer)
    }
  }

  this.commands.updateGeometries = (oldGeometries, newGeometries) => ({
    apply: () => this.updateGeometries(newGeometries),
    inverse: () => this.commands.updateGeometries(newGeometries, oldGeometries)
  })

  this.commands.updateEntries = (entries, updatedEntries) => ({
    apply: () => this.updateEntries(updatedEntries),
    inverse: () => this.commands.updateEntries(updatedEntries, entries)
  })
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

    this.propertiesStore_.createReadStream(options)
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

    this.geometryStore_.createReadStream(options)
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
  return this.propertiesStore_.get(id)
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

  // FIXME: does not return sometimes (queue full?)
  await this.propertiesStore_.batch(operations)
  this.emit('properties', { operations })
}


LayerStore.prototype.putLayer = async function (layer) {
  const { id, name, features } = layer
  await this.propertiesStore_.put(id, { name, id })

  await this.propertiesStore_.batch(features.map(feature => ({
    type: 'put',
    key: feature.id,
    value: feature
  })))

  await this.geometryStore_.batch(features.map(feature => ({
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
  await this.propertiesStore_.del(layerId)
  const op = key => ({ type: 'del', key })
  const layerUUID = layerId.split(':')[1]
  const keys = await this.keys(this.propertiesStore_, `feature:${layerUUID}`)
  const operations = keys.map(op)
  await this.propertiesStore_.batch(operations)
  await this.geometryStore_.batch(operations)
  this.emit('batch', { operations })
}

LayerStore.prototype.updateGeometries = async function (geometries) {
  const ops = Object.entries(geometries)
    .map(([key, value]) => [key, writeGeometryObject(value)])
    .map(([key, value]) => ({ type: 'put', key, value }))

  this.emit('geometries', { operations: ops })
  return this.geometryStore_.batch(ops)
}
