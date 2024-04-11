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

export const artilleryProperties = geometry => {
  const [baseline, taPoints, dzPoints] = TS.geometries(geometry)
  const dzCoordinate = TS.coordinates(dzPoints)

  // left of center, right of center
  const [x, y] = baseline.getCoordinates()
  const normal = TS.normalSegment(baseline)

  // clock-wise: near/left, far/left, far/right[, near/right]
  const [A, B, C] = TS.coordinates(taPoints)

  // center :: jts.geom.Coordinate
  const center = TS.midPoint(baseline)

  const angles = [
    TS.segment(x, B).angle() - normal.angle(),
    TS.segment(y, C).angle() - normal.angle()
  ]

  const params = { baseline, angles }

  // near/far depth of danger zone 1 (distance to near/far border of target area)
  // width of danger zone 1 (distance to left bound of target area)
  // width of danger zone 2 (distance to left bound of target area)

  params.taNear = TS.segment(center, A).getLength()
  params.taFar = TS.segment(center, B).getLength()
  params.dz1NearDepth = params.taNear - TS.segment(center, dzCoordinate[0]).getLength()
  params.dz1FarDepth = TS.segment(center, dzCoordinate[1]).getLength() - params.taFar
  params.dz1Width = TS.distance(dzCoordinate[2], TS.segment(x, B))
  params.dz2Width = TS.distance(dzCoordinate[3], TS.segment(x, B))

  return params
}

const unitSquare = TS.polygon([
  [-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]
].map(TS.coordinate))

/**
 * rectangle :: JTS/Geometry -> {k: v} -> JTS/Geometry
 * FIXME: duplicate code: hooks-rectangle.js
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

export const artillery = (geometry, params) => {
  console.log('artillery', params)

  const center = TS.midPoint(params.baseline)
  const [x, y] = TS.coordinates(params.baseline)
  const centerNormal = TS.normalSegment(params.baseline)
  const farB = TS.projectCoordinate(x)([centerNormal.angle() + params.angles[0], params.taFar * 10])
  const farC = TS.projectCoordinate(y)([centerNormal.angle() + params.angles[1], params.taFar * 10])
  const taLeft = TS.segment(x, farB)
  const taRight = TS.segment(y, farC)

  const taCoords = [
    TS.intersectCircle(center, params.taNear, taLeft),
    TS.intersectCircle(center, params.taFar, taLeft),
    TS.intersectCircle(center, params.taFar, taRight),
    TS.intersectCircle(center, params.taNear, taRight)
  ].flat()

  const taLeftMedian = TS.segment(taCoords[0], taCoords[1]).midPoint()
  const dangerZone1Depth = TS.projectCoordinateY(center, centerNormal.angle())
  const dangerZoneWidth = TS.projectCoordinateY(taLeftMedian, centerNormal.angle() + params.angles[0] + PI_OVER_2)
  const dz1Near = dangerZone1Depth(params.taNear - params.dz1NearDepth)
  const dz1Far = dangerZone1Depth(params.taFar + params.dz1FarDepth)
  const dz1Width = dangerZoneWidth(params.dz1Width)
  const dz2Width = dangerZoneWidth(params.dz2Width)

  return TS.collect([
    params.baseline,
    TS.multiPoint(taCoords),
    TS.multiPoint([dz1Near, dz1Far, dz1Width, dz2Width])
  ])
}
