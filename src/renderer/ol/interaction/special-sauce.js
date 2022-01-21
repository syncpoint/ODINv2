import * as MILSTD from '../../symbology/2525c'
import corridor from './corridor'
import fan from './fan'
import rectangle from './rectangle'
import { geometryType } from '../geometry'

const layouts = {
  'LineString:Point-corridor': corridor,
  'MultiPoint-fan': fan,
  'MultiPoint-circle': fan,
  'LineString:Point-orbit': corridor,
  'Polygon-rectangle': rectangle
}

const defaultBehavior = (feature, descriptor) => ({
  capture: (_, vertex) => vertex,
  roles: () => ['DEFAULT'],
  geometry: () => feature.getGeometry(),
  updateCoordinates: (_, coordinates) => feature.getGeometry().setCoordinates(coordinates),
  suppressVertexFeature: () => {
    if (!descriptor) return false
    if (descriptor.type === feature.getGeometry().getType() && descriptor.maxPoints === 2) return true
    return false
  }
})

export const special = (feature, overlay) => {
  const geometry = MILSTD.geometry(feature.get('sidc'))

  const key = geometry && geometry.layout
    ? `${geometryType(feature)}-${geometry.layout}`
    : `${geometryType(feature)}`

  return layouts[key]
    ? layouts[key](feature, geometry, overlay)
    : defaultBehavior(feature, geometry)
}
