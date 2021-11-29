import * as R from 'ramda'
import * as geom from 'ol/geom'
import { transform, getCoordinates } from '../../geometry'
import * as TS from '../../ts'
import { PI_OVER_2 } from '../../../../shared/Math'
import { cmdOrCtrl } from '../../../platform'

export const Hooks = {}

const corridor = node => {
  const geometry = node.feature.getGeometry()
  const { read, write } = transform(geometry)

  const params = () => {
    const [lineString, point] = TS.geometries(read(geometry))
    const coords = [TS.startPoint(lineString), point].map(TS.coordinate)
    const [A, B] = R.take(2, TS.coordinates([lineString]))
    const segment = TS.segment(A, B)
    const orientation = segment.orientationIndex(TS.coordinate(point))
    const width = TS.segment(coords).getLength()
    return { lineString, orientation, width }
  }

  const frame = (function create (params) {
    const { lineString, orientation, width } = params
    const [A, B] = R.take(2, TS.coordinates([lineString]))
    const bearing = TS.segment([A, B]).angle()
    const point = TS.point(TS.projectCoordinate(A)([bearing + orientation * PI_OVER_2, width]))
    const copy = properties => create({ ...params, ...properties })
    const geometry = write(TS.collect([lineString, point]))
    return { copy, lineString, point, coordinates: getCoordinates(geometry) }
  })(params())

  const handlers = {}

  handlers.Point = {
    project: xs => {
      const coordinate = TS.coordinate(read(new geom.Point(xs)))
      const [A, B] = R.take(2, TS.coordinates([frame.lineString]))
      const P = new TS.Coordinate(A.x - (B.y - A.y), A.y + (B.x - A.x))
      const segmentAP = TS.segment([A, P])
      const projected = segmentAP.project(coordinate)
      return write(TS.point(projected)).getFirstCoordinate()
    },
    coordinates: xs => {
      const point = read(new geom.Point(xs))
      const segmentAB = TS.segment(R.take(2, TS.coordinates([frame.lineString])))
      const segmentAP = TS.segment([TS.startPoint(frame.lineString), point].map(TS.coordinate))
      const orientation = segmentAB.orientationIndex(TS.coordinate(point))
      const width = segmentAP.getLength()
      return frame.copy({ orientation, width }).coordinates
    }
  }

  handlers.LineString = {
    project: R.identity,
    coordinates: xs => {
      const lineString = read(new geom.LineString(xs))
      return frame.copy({ lineString }).coordinates
    }
  }

  return handlers[node.geometry.getType()]
}

Hooks['LineString:Point-corridor'] = corridor
Hooks['LineString:Point-orbit'] = corridor

Hooks['MultiPoint-fan'] = node => {
  const geometry = node.feature.getGeometry()
  const { read, write } = transform(geometry)

  const params = () => {
    const [center, ...points] = TS.coordinates(read(geometry))
    const vectors = points
      .map(point => TS.segment([center, point]))
      .map(segment => ({ angle: segment.angle(), length: segment.getLength() }))
    return { center, vectors }
  }

  const frame = (function create (params) {
    const { center, vectors } = params
    const points = vectors.map(({ angle, length }) => TS.projectCoordinate(center)([angle, length]))
    const copy = properties => create({ ...params, ...properties })

    const geometry = write(TS.multiPoint([center, ...points].map(TS.point)))
    const coordinates = getCoordinates(geometry)
    return { center, points, copy, coordinates }
  })(params())

  const center = xs => {
    const center = read(new geom.Point(xs[0]))
    return frame.copy({ center: TS.coordinate(center) }).coordinates
  }

  return {
    project: R.identity,
    coordinates: node.index === 0
      ? center
      : R.identity
  }
}

Hooks['Polygon-rectangle'] = (node, offset) => {
  const geometry = node.feature.getGeometry()
  const { read, write } = transform(geometry)

  const params = geometry => {
    const rectangle = read(geometry)
    const coords = TS.coordinates(rectangle)
    const linearRing = rectangle.getExteriorRing()
    const centroid = TS.centroid(linearRing)
    const S01 = TS.segment([coords[0], coords[1]])
    const S12 = TS.segment([coords[1], coords[2]])
    const angle = S01.angle()
    const width = S01.getLength()
    const height = S12.getLength()
    return { centroid, width, height, angle }
  }

  const frame = function create (params) {
    const { centroid, width, height, angle } = params
    const copy = properties => create({ ...params, ...properties })
    const project = (angle, distance) => coord =>
      TS.projectCoordinate(coord)([angle, distance])

    const points = [[-1, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]]
      .map(([a, b]) => R.compose(project(angle + a * PI_OVER_2, height / 2), project(angle, b * width / 2)))
      .map(fn => fn(centroid))

    const geometry = write(TS.polygon(points))
    const coordinates = getCoordinates(geometry)
    return { copy, coordinates, centroid, points, angle }
  }

  const project = (coordinate, event) => {
    if (!event) return coordinate
    if (!cmdOrCtrl(event)) return coordinate

    const { centroid, points } = frame(params(geometry))
    const distance = TS.segment([centroid, points[offset]]).getLength()
    const point = TS.coordinate(read(new geom.Point(coordinate)))
    const angle = TS.segment([centroid, point]).angle()
    const projected = TS.projectCoordinate(centroid)([angle, distance])
    return write(TS.point(projected)).getFirstCoordinate()
  }

  const resize = xs => {
    const coordinates = TS.coordinates(read(new geom.Polygon(xs)))
    const lineSegments = R.aperture(2, coordinates).map(TS.segment)

    // Project point to next two adjacent segments.
    coordinates[(offset + 1) % 4] = lineSegments[(offset + 1) % 4].project(coordinates[offset])
    coordinates[(offset + 3) % 4] = lineSegments[(offset + 2) % 4].project(coordinates[offset])

    // unconditionally close ring.
    coordinates[4].setX(coordinates[0].getX())
    coordinates[4].setY(coordinates[0].getY())
    return frame(params(write(TS.polygon(coordinates)))).coordinates
  }

  const rotate = xs => {
    const current = frame(params(geometry))
    const { centroid, points } = current
    const angleA = TS.segment([centroid, points[offset]]).angle()
    const point = TS.coordinate(read(new geom.Point(xs[0][offset])))
    const angleB = TS.segment([centroid, point]).angle()
    const angle = current.angle + (angleB - angleA)
    return current.copy({ angle }).coordinates
  }

  const coordinates = (xs, event) => {
    const op = event && cmdOrCtrl(event)
      ? rotate
      : resize

    return op(xs)
  }

  return {
    project,
    coordinates
  }
}

Hooks.GeometryCollection = node => {
  const { feature, geometry } = node
  const featureGeometry = feature.getGeometry()

  return {
    project: R.identity,
    coordinates: coordinates => {
      const geometries = featureGeometry.getGeometriesArray()
      const index = geometries.findIndex(needle => needle === geometry)
      const xss = getCoordinates(featureGeometry)
      xss[index] = coordinates
      return xss
    }
  }
}

const NullHooks = {
  project: R.identity,
  coordinates: R.identity
}

Hooks.get = (node, offset) => {
  const hooks = Hooks[node.signature]
  return hooks ? hooks(node, offset) : NullHooks
}
