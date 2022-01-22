import Feature from 'ol/Feature'
import * as geom from 'ol/geom'
import { getPointResolution } from 'ol/proj'
import * as TS from '../ol/ts'
import { codeUTM, firstCoordinate } from '../epsg'
import GeoJSON from 'ol/format/GeoJSON'

export const geometryType = arg => {
  // OpenLayers:
  if (arg instanceof Feature) return geometryType(arg.getGeometry())
  else if (arg instanceof geom.GeometryCollection) return arg.getGeometries().map(geometryType).join(':')
  else if (arg instanceof geom.Geometry) return arg.getType()
  // GeoJSON:
  else if (arg.type === 'GeometryCollection') return arg.geometries.map(geometryType).join(':')
  else if (arg.type) return arg.type
  else return null
}

// Convert to/from JTS geometry.

export const transform = (olGeometry, target) => {
  const origin = firstCoordinate(olGeometry)
  const code = target !== 'EPSG:3857' ? codeUTM(origin) : null

  return {
    pointResolution: resolution => {
      return getPointResolution('EPSG:3857', resolution, origin)
    },

    read: olGeometry => {
      return TS.read(
        code
          ? olGeometry.clone().transform('EPSG:3857', code)
          : olGeometry
      )
    },

    write: jtsGeometry => {
      const olGeometry = TS.write(jtsGeometry)
      return code
        ? olGeometry.transform(code, 'EPSG:3857')
        : olGeometry
    }
  }
}

export const getCoordinates = geometry =>
  geometry instanceof geom.GeometryCollection
    ? geometry.getGeometries().map(getCoordinates)
    : geometry.getCoordinates()

export const setCoordinates = (geometry, coordinates) =>
  geometry instanceof geom.GeometryCollection
    ? geometry.getGeometriesArray().forEach((geometry, index) => setCoordinates(geometry, coordinates[index]))
    : geometry.setCoordinates(coordinates)

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
