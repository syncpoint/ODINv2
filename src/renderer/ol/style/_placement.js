import * as R from 'ramda'
import * as TS from '../ts'
import Polygon from './polygon-styles/placement'
import LineString from './linestring-styles/placement'

const PLACEMENT = {
  Polygon,
  LineString,
  MultiPoint: Polygon
}

const pointBuffer = geometry => {
  const [C, A] = TS.coordinates(geometry)
  const segment = TS.segment([C, A])
  return TS.pointBuffer(TS.point(C))(segment.getLength())

}

export default $ => {
  const placement = $.geometryType.map(geometryType => PLACEMENT[geometryType] || R.identity)
  const geometry = $.geometryType.chain(geometryType => {
    return R.cond([
      [R.equals('LineString'), R.always($.jtsSmoothenedGeometry)],
      [R.equals('Polygon'), R.always($.jtsSmoothenedGeometry)],
      [R.equals('MultiPoint'), R.always($.geometry.ap($.read).map(pointBuffer))]
    ])(geometryType)
  })

  return geometry.ap(placement)
}
