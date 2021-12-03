import * as R from 'ramda'
import * as geom from 'ol/geom'
import { transform, getCoordinates } from '../../geometry'
import * as TS from '../../ts'

export default node => {
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
