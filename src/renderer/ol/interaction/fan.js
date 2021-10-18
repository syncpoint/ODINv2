import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as TS from '../ts'
import * as EPSG from '../../epsg'

export default (feature, descriptor) => {
  const [center, ...points] = feature.getGeometry().getCoordinates()

  const geometries = {
    CENTER: new geom.Point(center),
    POINTS: new geom.MultiPoint(points)
  }

  const code = EPSG.codeUTM(feature)
  const toUTM = geometry => EPSG.toUTM(code, geometry)
  const fromUTM = geometry => EPSG.fromUTM(code, geometry)
  const read = R.compose(TS.read, toUTM)
  const write = R.compose(fromUTM, TS.write)

  const params = () => {
    const center = read(geometries.CENTER)
    const points = TS.geometries(read(geometries.POINTS))
    const vectors = points
      .map(point => TS.segment(TS.coordinates([center, point])))
      .map(segment => ({ angle: segment.angle(), length: segment.getLength() }))
    return { center, vectors }
  }

  let frame = (function create (params) {
    const { center, vectors } = params
    const points = vectors
      .map(({ angle, length }) => TS.projectCoordinate(TS.coordinate(center))([angle, length]))
      .map(TS.point)

    const copy = properties => create({ ...params, ...properties })
    geometries.CENTER.setCoordinates(write(center).getCoordinates())
    geometries.POINTS.setCoordinates(points.map(point => write(point).getCoordinates()))
    const geometry = new geom.MultiPoint([
      geometries.CENTER.getCoordinates(),
      ...geometries.POINTS.getCoordinates()
    ])

    return { center, points, copy, geometry }
  })(params())

  const updateCoordinates = (role, coordinates) => {
    geometries[role].setCoordinates(coordinates)

    if (role === 'CENTER') {
      const center = read(geometries[role])
      frame = frame.copy({ center })
      feature.setGeometry(frame.geometry)
      return ['POINTS'] // reindex POINTS geometry
    } else if (role === 'POINTS') {
      const points = TS.geometries(read(geometries[role]))
      const vectors = points
        .map(point => TS.segment(TS.coordinates([frame.center, point])))
        .map(segment => ({ angle: segment.angle(), length: segment.getLength() }))

      frame = frame.copy({ vectors })
      feature.setGeometry(frame.geometry)

      vectors.forEach((vector, index) => {
        const postfix = index || ''
        feature.set(`am${postfix}`, `${Math.floor(vector.length)}`)
      })
    }
  }

  return {
    capture: (_, vertex) => vertex,
    updateCoordinates,
    suppressVertexFeature: () => true,
    roles: () => Object.keys(geometries),
    geometry: role => geometries[role]
  }
}
