import * as R from 'ramda'
import * as TS from '../../ol/ts'
import { DEG2RAD, RAD2DEG, PI_OVER_2 } from '../../../shared/Math'


/**
 * rectangleProperties :: JTS/Geometry -> {k: v}
 */
export const rectangleProperties = geometry => {
  const coordinates = TS.coordinates(geometry)
  const segment01 = TS.segment(coordinates[0], coordinates[1])
  const segment12 = TS.segment(coordinates[1], coordinates[2])

  return {
    an: Math.round(RAD2DEG * TS.normalizePositive(segment01.angle())),
    am: Math.round(segment01.getLength()),
    am1: Math.round(segment12.getLength())
  }
}

export const circleProperties = geometry => {
  const coordinates = TS.coordinates(geometry)
  const segment01 = TS.segment(coordinates[0], coordinates[1])

  return {
    an: Math.round(RAD2DEG * TS.normalizePositive(segment01.angle())),
    am: Math.round(segment01.getLength())
  }
}

export const corridorProperties = geometry => {
  const [lineString, point] = TS.geometries(geometry)
  const coords = [TS.startPoint(lineString), point].map(TS.coordinate)
  const [A, B] = R.take(2, TS.coordinates([lineString]))
  const segment = TS.segment(A, B)

  return {
    am: Math.round(2 * TS.segment(coords).getLength()),
    am1: segment.orientationIndex(TS.coordinate(point))
  }
}

export const GeometryProperties = {
  RECTANGLE: rectangleProperties,
  CIRCLE: circleProperties,
  CORRIDOR: corridorProperties
}

const unitSquare = TS.polygon([
  [-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]
].map(TS.coordinate))

/**
 * rectangle :: JTS/Geometry -> {k: v} -> JTS/Geometry
 */
export const rectangle = (geometry, { am, am1, an }) => {
  const linearRing = geometry.getExteriorRing()
  const center = TS.centroid(linearRing)
  const scale = TS.AffineTransformation.scaleInstance(am / 2, am1 / 2)
  const rotate = TS.AffineTransformation.rotationInstance(DEG2RAD * an)
  const translate = TS.AffineTransformation.translationInstance(center.x, center.y)

  const matrix = new TS.AffineTransformation()
  matrix.compose(scale)
  matrix.compose(rotate)
  matrix.compose(translate)

  return matrix.transform(unitSquare)
}

export const corridor = (geometry, { am, am1 }) => {
  const [lineString] = TS.geometries(geometry)
  const [A, B] = R.take(2, TS.coordinates([lineString]))
  const bearing = TS.segment([A, B]).angle()
  const C = TS.point(TS.projectCoordinate(A)([bearing + am1 * PI_OVER_2, am / 2]))
  return TS.collect([lineString, C])
}

/**
 * circle :: JTS/Geometry -> {k: v} -> JTS/Geometry
 */
export const circle = (geometry, { am, an }) => {
  const [center] = TS.coordinates(geometry)
  const point = TS.projectCoordinate(center)([DEG2RAD * an, am])
  const circle = TS.multiPoint([center, point].map(TS.point))
  return circle
}
