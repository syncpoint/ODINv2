import Polygon from 'ol/geom/Polygon'
import GeometryType from '../GeometryType'

// A LineString counts as a closed ring when its endpoints are within
// this distance [projection units] — boundaries drawn around an area
// rarely snap exactly onto their starting point.
const CLOSE_TOLERANCE = 100

/**
 * Interpret a feature geometry as an area for observer siting.
 * Polygons are used as-is; a (nearly) closed LineString — e.g. a
 * boundary drawn around an area — is converted to a polygon.
 *
 * @param {import('ol/geom/Geometry').default} geometry
 * @returns {Polygon|null}
 */
export const polygonOf = geometry => {
  if (!geometry) return null
  const type = geometry.getType()

  if (type === GeometryType.POLYGON) return geometry.clone()

  if (type === GeometryType.LINE_STRING) {
    const coords = geometry.getCoordinates()
    if (coords.length < 4) return null
    const [x1, y1] = coords[0]
    const [x2, y2] = coords[coords.length - 1]
    if (Math.hypot(x2 - x1, y2 - y1) > CLOSE_TOLERANCE) return null
    const ring = [...coords]
    if (x1 !== x2 || y1 !== y2) ring.push([x1, y1])
    return new Polygon([ring])
  }

  return null
}
