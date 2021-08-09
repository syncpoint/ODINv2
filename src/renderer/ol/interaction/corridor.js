import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as TS from '../ts'
import * as EPSG from '../../epsg'

export default (feature, descriptor) => {
  const [lineString, point] = feature.getGeometry().getGeometries()

  const geometries = {
    CENTER: lineString,
    POINT: point
  }

  const code = EPSG.codeUTM(feature)
  const toUTM = geometry => EPSG.toUTM(code, geometry)
  const fromUTM = geometry => EPSG.fromUTM(code, geometry)
  const read = R.compose(TS.read, toUTM)
  const write = R.compose(fromUTM, TS.write)

  const capture = (vertex, segments) => {
    if (segments.length !== 1) return vertex
    if (segments[0][0].role !== 'POINT') return vertex

    // Project point onto normal vector of first segment:
    const coordinate = TS.coordinate(read(new geom.Point(vertex)))
    const [A, B] = R.take(2, TS.coordinates([frame.center]))
    const P = new TS.Coordinate(A.x - (B.y - A.y), A.y + (B.x - A.x))
    const segmentAP = TS.segment([A, P])
    const projected = segmentAP.project(coordinate)
    return write(TS.point(projected)).getFirstCoordinate()
  }

  const params = () => {
    const center = read(geometries.CENTER)
    const point = read(geometries.POINT)
    const coords = [TS.startPoint(center), point].map(TS.coordinate)
    const [A, B] = R.take(2, TS.coordinates([center]))
    const segment = TS.segment(A, B)
    const orientation = segment.orientationIndex(TS.coordinate(point))
    const width = TS.segment(coords).getLength()
    return { center, orientation, width }
  }

  let frame = (function create (params) {
    const { center, orientation, width } = params
    const [A, B] = R.take(2, TS.coordinates([center]))
    const bearing = TS.segment([A, B]).angle()
    const point = TS.point(TS.projectCoordinate(A)([bearing + orientation * Math.PI / 2, width]))
    const copy = properties => create({ ...params, ...properties })

    geometries.CENTER.setCoordinates(write(center).getCoordinates())
    geometries.POINT.setCoordinates(write(point).getCoordinates())
    const geometry = new geom.GeometryCollection([geometries.CENTER, geometries.POINT])

    return { copy, center, point, geometry }
  })(params())

  const updateCoordinates = (role, _, coordinates) => {
    geometries[role].setCoordinates(coordinates)

    if (role === 'CENTER') {
      const center = read(geometries[role])
      frame = frame.copy({ center })
      feature.setGeometry(frame.geometry)
      return ['POINT'] // reindex POINT geometry
    } else if (role === 'POINT') {
      const point = read(geometries[role])
      const segment = TS.segment(R.take(2, TS.coordinates([frame.center])))
      const coords = [TS.startPoint(frame.center), point].map(TS.coordinate)
      const orientation = segment.orientationIndex(TS.coordinate(point))
      const width = TS.segment(coords).getLength()
      frame = frame.copy({ orientation, width })
      feature.setGeometry(frame.geometry)
    }
  }

  const suppressVertexFeature = role => {
    if (descriptor.layout === 'orbit') return true
    else if (role === 'CENTER' && descriptor.maxPoints === 2) return true
    else return false
  }

  return {
    capture,
    updateCoordinates,
    suppressVertexFeature,
    roles: () => Object.keys(geometries),
    geometry: role => geometries[role]
  }
}
