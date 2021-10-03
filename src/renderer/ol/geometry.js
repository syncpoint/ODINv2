import * as R from 'ramda'
import Feature from 'ol/Feature'
import Geometry from 'ol/geom/Geometry'
import GeometryCollection from 'ol/geom/GeometryCollection'
import * as TS from './ts'
import { codeUTM } from '../epsg'

export const geometryType = arg => {
  if (arg instanceof Feature) return geometryType(arg.getGeometry())
  else if (arg instanceof GeometryCollection) return arg.getGeometries().map(geometryType).join(':')
  else if (arg instanceof Geometry) return arg.getType()
  else return null
}

// Convert to/from JTS geometry.

export const transform = (olGeometry, target) => {
  const code = target !== 'EPSG:3857' ? codeUTM(olGeometry) : null

  return {
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

export const identity = () => ({
  read: R.identity,
  write: R.identity
})
