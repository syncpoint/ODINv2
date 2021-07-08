import util from 'util'
import Emitter from '../../shared/emitter'
import GeoJSON from 'ol/format/GeoJSON'
import VectorSource from 'ol/source/Vector'

const format = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

// const readFeature = source => format.readFeature(source)
const readFeatures = source => format.readFeatures(source)
// const readGeometry = source => format.readGeometry(source)
// const writeGeometry = geometry => format.writeGeometry(geometry)
// const writeGeometryObject = geometry => format.writeGeometryObject(geometry)
// const writeFeaturesObject = features => format.writeFeaturesObject(features)
// const writeFeatureObject = feature => format.writeFeatureObject(feature)

export function Sources (layerStore) {
  Emitter.call(this)
  this.layerStore = layerStore
}

Sources.prototype.getFeatureSources = async function () {
  const layers = await this.layerStore.getFeatures()
  const sources = Object.entries(layers).reduce((acc, [key, features]) => {
    acc[key] = new VectorSource({ features: readFeatures(features) })
    return acc
  }, {})

  return sources
}

util.inherits(Sources, Emitter)
