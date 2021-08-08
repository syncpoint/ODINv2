import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as TS from '../ts'
import * as EPSG from '../../epsg'

export default (feature, descriptor) => {
  const [lineString, point] = feature.getGeometry().getGeometries()

  const code = EPSG.codeUTM(feature)
  const toUTM = geometry => EPSG.toUTM(code, geometry)
  const fromUTM = geometry => EPSG.fromUTM(code, geometry)

  const geometries = {
    CENTER: lineString,
    POINT: point
  }

  const params = () => {
    const center = TS.read(toUTM(geometries.CENTER))
    const point = TS.read(toUTM(geometries.POINT))
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
    const geometry = new geom.GeometryCollection([geometries.CENTER, geometries.POINT])

    geometries.CENTER.setCoordinates(fromUTM(TS.write(center)).getCoordinates())
    geometries.POINT.setCoordinates(fromUTM(TS.write(point)).getCoordinates())

    return { copy, center, point, geometry }
  })(params())

  const capture = (vertex, segments) => {
    if (segments.length !== 1) return vertex
    if (segments[0][0].role !== 'POINT') return vertex

    // Project point onto normal vector of first segment:
    const coordinate = TS.coordinate(TS.read(toUTM(new geom.Point(vertex))))
    const [A, B] = R.take(2, TS.coordinates([frame.center]))
    const P = new TS.Coordinate(A.x - (B.y - A.y), A.y + (B.x - A.x))
    const segmentAP = TS.segment([A, P])
    const projected = segmentAP.project(coordinate)
    return fromUTM(TS.write(TS.point(projected))).getFirstCoordinate()
  }

  const segmentUpdaters = {
    Point: (vertex, [segmentData]) => {
      const segment = segmentData.segment
      const coordinates = vertex
      segment[0] = vertex
      segment[1] = vertex
      return coordinates
    },
    LineString: (vertex, [segmentData, index]) => {
      const segment = segmentData.segment
      const geometry = segmentData.geometry
      const coordinates = geometry.getCoordinates()
      coordinates[segmentData.index + index] = vertex
      segment[index] = vertex
      return coordinates
    }
  }

  const updateSegment = (vertex, dragSegment) => {
    const geometry = dragSegment[0].geometry
    const role = dragSegment[0].role
    if (!segmentUpdaters[geometry.getType()]) return

    const coordinates = segmentUpdaters[geometry.getType()](vertex, dragSegment)
    geometry.setCoordinates(coordinates)

    if (role === 'CENTER') {
      const center = TS.read(toUTM(geometry))
      frame = frame.copy({ center })
      feature.setGeometry(frame.geometry)
      return ['POINT']
    } else if (role === 'POINT') {
      const point = TS.read(toUTM(geometry))
      const segment = TS.segment(R.take(2, TS.coordinates([frame.center])))
      const coords = [TS.startPoint(frame.center), point].map(TS.coordinate)
      const orientation = segment.orientationIndex(TS.coordinate(point))
      const width = TS.segment(coords).getLength()
      frame = frame.copy({ orientation, width })
      feature.setGeometry(frame.geometry)
    }
  }

  const updateCoordinates = (role, coordinates) => {
    console.log('[updateCoordinates]', role, coordinates)
    geometries[role].setCoordinates(coordinates)

    if (role === 'CENTER') {
      const center = TS.read(toUTM(geometries[role]))
      frame = frame.copy({ center })
      feature.setGeometry(frame.geometry)
      return ['POINT']
    }
  }

  return {
    capture,
    updateSegment,
    updateCoordinates,
    roles: () => Object.keys(geometries),
    geometry: role => geometries[role]
  }
}
