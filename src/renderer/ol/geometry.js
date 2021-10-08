import Feature from 'ol/Feature'
import * as geom from 'ol/geom'
import { getPointResolution } from 'ol/proj'
import * as TS from './ts'
import { codeUTM, firstCoordinate } from '../epsg'

export const geometryType = arg => {
  if (arg instanceof Feature) return geometryType(arg.getGeometry())
  else if (arg instanceof geom.GeometryCollection) return arg.getGeometries().map(geometryType).join(':')
  else if (arg instanceof geom.Geometry) return arg.getType()
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
