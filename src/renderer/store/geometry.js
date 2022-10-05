export const type = descriptor => descriptor?.geometry?.type
  ? descriptor?.geometry?.type === 'GeometryCollection' || descriptor?.geometry?.type === 'MultiPoint'
    ? descriptor?.geometry?.layout
    : descriptor?.geometry?.type
  : 'n/a'

export const bbox = geojson => {
  const bbox = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY
  ]

  // Update bbox with each coordinate
  let dimensions = 2
  for (const coordinate of coordEach(geojson)) {
    dimensions = Math.max(dimensions, coordinate.length)
    for (let i = 0; i < coordinate.length; ++i) {
      const j = 3 + i
      bbox[i] = Math.min(bbox[i], coordinate[i])
      bbox[j] = Math.max(bbox[j], coordinate[i])
    }
  }

  // Remove 3rd dimension if not present in data.
  if (dimensions !== 3) {
    return [bbox[0], bbox[1], bbox[3], bbox[4]]
  }

  return bbox
}

/**
 * @description Generator that yields each GeoJSON coordinate.
 * @param {GeoJSON} geojson Input GeoJSON.
 * @yields [Array] GeoJSON 2D or 3D coordinate.
 */
function * coordEach (geojson) {
  switch (geojson.type) {
    case 'Point':
      yield geojson.coordinates
      break
    case 'LineString':
    case 'MultiPoint':
      yield * geojson.coordinates
      break
    case 'Polygon':
    case 'MultiLineString':
      for (const part of geojson.coordinates) {
        yield * part
      }
      break
    case 'MultiPolygon':
      for (const polygon of geojson.coordinates) {
        for (const ring of polygon) {
          yield * ring
        }
      }
      break
    case 'GeometryCollection':
      for (const geometry of geojson.geometries) {
        yield * coordEach(geometry)
      }
      break
    case 'FeatureCollection':
      for (const feature of geojson.features) {
        yield * coordEach(feature)
      }
      break
    default:
      yield * coordEach(geojson.geometry)
  }
}
