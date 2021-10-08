import * as R from 'ramda'
import { transform, geometryType } from '../geometry'
import { smooth } from './chaikin'


/**
 *
 */
export const readGeometry = context => {
  const { feature, resolution } = context

  const geometry = feature.getGeometry()
  const { read, write, pointResolution } = transform(geometry)
  context.resolution = pointResolution(resolution)
  context.read = read
  context.write = write
  context.geometryType = geometryType(geometry)
  context.properties = feature.getProperties()

  context.simplified = context.geometryType === 'Polygon'
    ? geometry.getCoordinates()[0].length > 50
    : context.geometryType === 'LineString'
      ? geometry.getCoordinates().length > 50
      : false

  const simplifiedGeometry = context.simplified
    ? geometry.simplify(resolution)
    : geometry

  context.smoothed = feature.get('style') && feature.get('style').smooth
  const smoothedGeometry = context.smoothed
    ? smooth(simplifiedGeometry)
    : simplifiedGeometry

  context.geometry = read(smoothedGeometry)
  context.simplifiedGeometry = context.smoothed
    ? read(simplifiedGeometry)
    : context.geometry

  return context
}


/**
 *
 */
export const writeGeometries = (styles, write) => {
  return styles
    .filter(R.prop('geometry'))
    .map(style => ({ ...style, geometry: write(style.geometry) }))
}
