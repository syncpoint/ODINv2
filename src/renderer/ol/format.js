import GeoJSON from 'ol/format/GeoJSON'

export const format = new GeoJSON({
  dataProjection: 'EPSG:3857',
  featureProjection: 'EPSG:3857'
})

/**
 * Note: If source does not include a geometry, geometry of resulting feature is `null`.
 */
export const readFeature = format.readFeature.bind(format)
export const readFeatures = format.readFeatures.bind(format)
export const readGeometry = format.readGeometry.bind(format)
export const writeGeometry = format.writeGeometry.bind(format)
export const writeGeometryObject = format.writeGeometryObject.bind(format)

// writeFeatureCollection :: [ol/Feature] -> GeoJSON/FeatureCollection
export const writeFeatureCollection = format.writeFeaturesObject.bind(format)
export const writeFeatureObject = format.writeFeatureObject.bind(format)
