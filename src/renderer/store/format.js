import GeoJSON from 'ol/format/GeoJSON'

const format = new GeoJSON({
  dataProjection: 'EPSG:3857',
  featureProjection: 'EPSG:3857'
})

export const readFeature = source => format.readFeature(source)
export const readFeatures = source => format.readFeatures(source)
export const readGeometry = source => format.readGeometry(source)
export const writeGeometry = geometry => format.writeGeometry(geometry)
export const writeGeometryObject = geometry => format.writeGeometryObject(geometry)
export const writeFeatureCollection = features => format.writeFeaturesObject(features)
export const writeFeatureObject = feature => format.writeFeatureObject(feature)
