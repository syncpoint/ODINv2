import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as TS from '../ts'
import { PI_OVER_2 } from '../../../shared/Math'
import { transform } from '../geometry'
import { cmdOrCtrl } from '../../platform'

export default (feature) => {

  const geometries = {
    RECTANGLE: feature.getGeometry()
  }

  const { read, write } = transform(feature.getGeometry())

  const params = (geometry) => {
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

  let frame = (function create (params) {
    const { centroid, width, height, angle } = params
    const copy = properties => create({ ...params, ...properties })
    const project = (angle, distance) => coord =>
      TS.projectCoordinate(coord)([angle, distance])

    const points = [[-1, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]]
      .map(([a, b]) => R.compose(project(angle + a * PI_OVER_2, height / 2), project(angle, b * width / 2)))
      .map(fn => fn(centroid))

    const geometry = write(TS.polygon(points))
    return { copy, geometry, centroid, points, angle }
  })(params(feature.getGeometry()))


  const vertexIndex = (segments) => {
    const indices = segments.map(segment => segment.index)
    if (indices[0] === 0 && indices[1] === 1) return 1
    else if (indices[0] === 1 && indices[1] === 2) return 2
    else if (indices[0] === 2 && indices[1] === 3) return 3
    else return 0
  }

  const capture = (role, vertex, segments, event) => {
    if (!cmdOrCtrl(event.originalEvent)) return vertex

    // capture (rotate)
    const index = vertexIndex(segments)
    const { centroid, points } = frame
    const distance = TS.segment([centroid, points[index]]).getLength()
    const point = TS.coordinate(read(new geom.Point(vertex)))
    const angle = TS.segment([centroid, point]).angle()
    const projected = TS.projectCoordinate(centroid)([angle, distance])
    return write(TS.point(projected)).getFirstCoordinate()
  }

  const resize = (coords, index) => {
    const lineSegments = R.aperture(2, coords).map(TS.segment)

    // Project point to next two adjacent segments.
    coords[(index + 1) % 4] = lineSegments[(index + 1) % 4].project(coords[index])
    coords[(index + 3) % 4] = lineSegments[(index + 2) % 4].project(coords[index])

    // unconditionally close ring.
    coords[4].setX(coords[0].getX())
    coords[4].setY(coords[0].getY())
    frame = frame.copy(params(write(TS.polygon(coords))))
  }

  const rotate = (coords, index) => {
    const { centroid, points } = frame
    const angleA = TS.segment([centroid, points[index]]).angle()
    const angleB = TS.segment([centroid, coords[index]]).angle()
    frame = frame.copy({ angle: frame.angle + (angleB - angleA) })
  }

  const updateCoordinates = (role, coordinates, segments, event) => {
    coordinates[0][4] = coordinates[0][0]
    geometries[role].setCoordinates(coordinates)

    const rectangle = read(geometries[role])
    const coords = TS.coordinates(rectangle)
    const index = vertexIndex(segments)

    const update = cmdOrCtrl(event.originalEvent)
      ? rotate
      : resize

    update(coords, index)
    feature.setGeometry(frame.geometry)
  }

  return {
    capture,
    updateCoordinates,
    suppressVertexFeature: () => true,
    roles: () => Object.keys(geometries),
    geometry: role => geometries[role]
  }
}
