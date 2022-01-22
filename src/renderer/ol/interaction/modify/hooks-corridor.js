import * as R from 'ramda'
import * as geom from 'ol/geom'
import { transform, getCoordinates } from '../../../model/geometry'
import * as TS from '../../ts'
import { PI_OVER_2 } from '../../../../shared/Math'

export default node => {
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
