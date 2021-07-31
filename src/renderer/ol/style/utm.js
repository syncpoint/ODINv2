import proj4 from 'proj4'

// [EPSG:3857] -> string
export const utmSRID = coordinate => {
  const proj = proj4('EPSG:3857', 'EPSG:4326')
  const [longitude, latitude] = proj.forward(coordinate)
  const zone = Math.ceil((longitude + 180) / 6)
  const south = latitude < 0
  const code = (south ? 32700 : 32600) + zone
  return `EPSG:${code}`
}

// Reference point for given geometry.
export const reference = geometry => {
  switch (geometry.getType()) {
    case 'GeometryCollection': return reference(geometry.getGeometries()[0])
    default: return geometry.getFirstCoordinate()
  }
}

export const transform = geometry => {
  const coordinate = reference(geometry)
  const srid = utmSRID(coordinate)
  return {
    toUTM: geometry => geometry.clone().transform('EPSG:3857', srid),
    fromUTM: geometry => geometry.clone().transform(srid, 'EPSG:3857'),
    withUTM: fn => {
      console.log('[withUTM]', srid)
      const transformed = geometry.transform('EPSG:3857', srid)
      const calculated = fn(transformed)
      return calculated.transform(srid, 'EPSG:3857')
    }
  }
}

export const use = fn => geometry => {
  const coordinate = reference(geometry)
  const srid = utmSRID(coordinate)
  const transformed = geometry.clone().transform('EPSG:3857', srid)
  const calculated = fn(transformed)
  return Array.isArray(calculated)
    ? calculated.map(geometry => geometry.transform(srid, 'EPSG:3857'))
    : calculated.transform(srid, 'EPSG:3857')
}
