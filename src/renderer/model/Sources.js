import util from 'util'
import GeoJSON from 'ol/format/GeoJSON'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Emitter from '../../shared/emitter'
import { isFeature } from '../ids'

const format = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

const readFeature = source => format.readFeature(source)
const readFeatures = source => format.readFeatures(source)
// const readGeometry = source => format.readGeometry(source)
// const writeGeometry = geometry => format.writeGeometry(geometry)
// const writeGeometryObject = geometry => format.writeGeometryObject(geometry)
// const writeFeaturesObject = features => format.writeFeaturesObject(features)
// const writeFeatureObject = feature => format.writeFeatureObject(feature)


/**
 * removeFeature :: ol/Feature | string -> unit
 */
const removeFeature = source => x => {
  if (x instanceof Feature) source.removeFeature(x)
  else if (x.type === 'Feature') removeFeature(x.id)
  else if (typeof x === 'string') source.removeFeature(source.getFeatureById(x))
}

const addFeature = source => x => {
  if (!x || x.hidden || !isFeature(x.id)) return
  source.addFeature(readFeature(x))
}

export function Sources (layerStore) {
  Emitter.call(this)
  this.layerStore = layerStore

  // For now, hold all features in a single source.
  // This might change in the future, especially for 'external' features/sources.
  // Note: Source is mutable. Changes reflect more or less immediately in map.
  this.featureSource = null

  layerStore.on('batch', ({ operations }) => this.storeBatch_(operations))
}

util.inherits(Sources, Emitter)

Sources.prototype.storeBatch_ = function (operations) {
  if (!this.featureSource) this.featureSource = new VectorSource({ features: [] })

  const removals = operations.filter(op => op.type === 'del').map(op => op.key)
  const additions = operations.filter(op => op.type === 'put').map(op => op.value)

  removals.forEach(removeFeature(this.featureSource))
  additions.forEach(removeFeature(this.featureSource))
  additions.forEach(addFeature(this.featureSource)) // TODO: bulk - addFeatures()
}

Sources.prototype.getFeatureSource = async function () {
  if (this.featureSource) return this.featureSource

  console.time('load')
  const json = await this.layerStore.getFeatures()
  console.timeEnd('load')

  console.time('read')
  const features = readFeatures(json)
  this.featureSource = new VectorSource({ features })
  console.timeEnd('read')

  return this.featureSource
}
