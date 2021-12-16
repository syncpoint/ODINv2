import * as R from 'ramda'
import * as geom from 'ol/geom'
import { platformModifierKeyOnly } from 'ol/events/condition'
import { transform, getCoordinates } from '../../geometry'
import * as TS from '../../ts'

export default (node, offset) => {
  const geometry = node.feature.getGeometry()
  const { read, write } = transform(geometry)
  const unitSquare = TS.polygon([
    [-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]
  ].map(TS.coordinate))

  const params = geometry => {
    const rectangle = read(geometry)
    const linearRing = rectangle.getExteriorRing()
    const coords = TS.coordinates(rectangle)
    const segments = R.take(2, R.aperture(2, coords)).map(TS.segment)

    return {
      center: TS.centroid(linearRing),
      extent: segments.map(segment => segment.getLength()),
      angle: segments[0].angle()
    }
  }

  const frame = function create (params) {
    const copy = properties => create({ ...params, ...properties })
    const { center } = params
    const scale = TS.AffineTransformation.scaleInstance(params.extent[0] / 2, params.extent[1] / 2)
    const rotate = TS.AffineTransformation.rotationInstance(params.angle)
    const translate = TS.AffineTransformation.translationInstance(center.x, center.y)

    const matrix = new TS.AffineTransformation()
    matrix.compose(scale)
    matrix.compose(rotate)
    matrix.compose(translate)

    const rectangle = matrix.transform(unitSquare)
    const geometry = write(rectangle)
    const coordinates = getCoordinates(geometry)

    const angle = (offset, point) => {
      const points = TS.coordinates(rectangle)
      const angleA = TS.segment([center, points[offset]]).angle()
      const angleB = TS.segment([center, TS.coordinate(point)]).angle()
      const angle = params.angle + (angleB - angleA)
      return angle
    }

    const extent = point => {
      const matrix = new TS.AffineTransformation()
      matrix.compose(rotate)
      matrix.compose(translate)
      const axis = [[0, -1], [0, 1], [-1, 0], [1, 0]]
        .map(TS.coordinate)
        .map(coord => matrix.transform(coord, coord))

      return [
        TS.AffineTransformation.reflectionInstance(axis[0].x, axis[0].y, axis[1].x, axis[1].y),
        TS.AffineTransformation.reflectionInstance(axis[2].x, axis[2].y, axis[3].x, axis[3].y)
      ]
        .map(reflection => reflection.transform(point))
        .map(mirror => TS.segment([point, mirror].map(TS.coordinate)))
        .map(segment => segment.getLength())
    }

    const project = (offset, point) => {
      const points = TS.coordinates(rectangle)
      const distance = TS.segment([center, points[offset]]).getLength()
      const angle = TS.segment([center, TS.coordinate(point)]).angle()
      const projected = TS.projectCoordinate(center)([angle, distance])
      return TS.point(projected)
    }

    return { copy, coordinates, angle, extent, project }
  }

  const project = (coordinate, condition) => {
    if (!condition) return coordinate
    if (!condition(platformModifierKeyOnly)) return coordinate

    const current = frame(params(geometry))
    const point = read(new geom.Point(coordinate))
    const projected = current.project(offset, point)
    return write(projected).getFirstCoordinate()
  }

  const resize = xs => {
    const current = frame(params(geometry))
    const point = read(new geom.Point(xs[0][offset]))
    const extent = current.extent(point)
    const next = current.copy({ extent })
    return next.coordinates
  }

  const rotate = xs => {
    const current = frame(params(geometry))
    const point = read(new geom.Point(xs[0][offset]))
    const angle = current.angle(offset, point)
    const next = current.copy({ angle })
    return next.coordinates
  }

  const coordinates = (xs, condition) =>
    (condition && condition(platformModifierKeyOnly) ? rotate : resize)(xs)

  return {
    project,
    coordinates
  }
}
