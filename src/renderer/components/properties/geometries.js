import * as TS from '../../ol/ts'
import { DEG2RAD, RAD2DEG } from '../../../shared/Math'


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

const unitSquare = TS.polygon([
  [-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]
].map(TS.coordinate))

/**
 * rectangle :: JTS/Geometry -> {k: v} -> JTS/Geometry
 */
export const rectangle = (geometry, { am, am1, an }) => {
  // FIXME: duplicate code: hooks-rectangle.js

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
