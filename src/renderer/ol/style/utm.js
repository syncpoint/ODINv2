import proj4 from 'proj4'

// [EPSG:3857] -> string
export const utmSRID = coordinate => {
  const proj = proj4('EPSG:3857', 'EPSG:4326')
  const [longitude, latitude] = proj.forward(coordinate)
  const zone = Math.ceil((longitude + 180) / 6)
  const south = latitude < 0
  return (south ? 32700 : 32600) + zone
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
    srid,
    toUTM: geometry => {
      const transformed = geometry.clone().transform('EPSG:3857', `EPSG:${srid}`)
      transformed.set('srid', srid)
      return transformed
    },
    fromUTM: geometry => {
      const transformed = geometry.clone().transform(`EPSG:${srid}`, 'EPSG:3857')
      transformed.set('srid', 3857)
      return transformed
    }
  }
}

export const use = fn => geometry => {
  const coordinate = reference(geometry)
  const srid = utmSRID(coordinate)
  const transformed = geometry.clone().transform('EPSG:3857', `EPSG:${srid}`)
  const calculated = fn(transformed)
  return Array.isArray(calculated)
    ? calculated.map(geometry => geometry.transform(`EPSG:${srid}`, 'EPSG:3857'))
    : calculated.transform(`EPSG:${srid}`, 'EPSG:3857')
}
