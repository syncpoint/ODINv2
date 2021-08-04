import * as R from 'ramda'
import proj4 from 'proj4'
import Feature from 'ol/Feature'
import Geometry from 'ol/geom/Geometry'
import GeometryCollection from 'ol/geom/GeometryCollection'
import { register } from 'ol/proj/proj4'
import projections from './epsg.json'

projections.forEach(projection => {
  proj4.defs(projection.code, projection.definition)
})

// Register all 60 N/S UTM zones with proj4:
;(() => R.range(1, 61).forEach(i => {
  proj4.defs(`EPSG:${32600 + i}`, `+proj=utm +zone=${i} +ellps=WGS84 +datum=WGS84 +units=m +no_defs`)
  proj4.defs(`EPSG:${32700 + i}`, `+proj=utm +zone=${i} +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs`)
}))()


/* make projections available to OL */
register(proj4)

const WEB_MERCATOR_TO_WGS84 = proj4('EPSG:3857', 'EPSG:4326')

/**
 *
 * @param {ol/Feature|ol/Geometry} arg
 */
export const codeUTM = arg => {
  if (arg instanceof Feature) return codeUTM(arg.getGeometry())
  else if (arg instanceof GeometryCollection) return codeUTM(arg.getGeometries()[0])
  else if (arg instanceof Geometry) return codeUTM(arg.getFirstCoordinate())

  // Here, we should have a coordinate.
  const coordinate = arg
  const [longitude, latitude] = WEB_MERCATOR_TO_WGS84.forward(coordinate)
  const zone = Math.ceil((longitude + 180) / 6)
  const south = latitude < 0
  return `EPSG:${(south ? 32700 : 32600) + zone}`
}
