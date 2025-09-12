import proj4 from 'proj4'
import Feature from 'ol/Feature'
import Geometry from 'ol/geom/Geometry'
import GeometryCollection from 'ol/geom/GeometryCollection'
import { register } from 'ol/proj/proj4'
import { defs } from './proj4_defs'

// Add additional projections:
defs(proj4)

/* make projections available to OL */
register(proj4)

const WEB_MERCATOR_TO_WGS84 = proj4('EPSG:3857', 'EPSG:4326')

export const toUTM = (code, geometry) => geometry.clone().transform('EPSG:3857', code)
export const fromUTM = (code, geometry) => geometry.transform(code, 'EPSG:3857')

export const firstCoordinate = geometryLike => {
  if (geometryLike instanceof Feature) return firstCoordinate(geometryLike.getGeometry())
  else if (geometryLike instanceof GeometryCollection) return firstCoordinate(geometryLike.getGeometries()[0])
  else if (geometryLike instanceof Geometry) return firstCoordinate(geometryLike.getFirstCoordinate())
  else return geometryLike
}

/**
 *
 * @param {ol/Feature|ol/Geometry} arg
 */
export const codeUTM = coordOrFeature => {
  const coord = firstCoordinate(coordOrFeature)
  const [longitude, latitude] = WEB_MERCATOR_TO_WGS84.forward(coord)
  const zone = Math.ceil((longitude + 180) / 6)
  const south = latitude < 0
  return `EPSG:${(south ? 32700 : 32600) + zone}`
}
