import { style } from './__style'
import { smooth } from './chaikin'

const simplifyGeometry = (geometry, resolution) =>
  geometry.getCoordinates()[0].length > 50
    ? geometry.simplify(resolution)
    : geometry

const smoothenGeometry = geometry => smooth(geometry)

export default {
  simplifyGeometry,
  smoothenGeometry,
  style: feature => feature.$smoothenedGeometry.map(style)
}
