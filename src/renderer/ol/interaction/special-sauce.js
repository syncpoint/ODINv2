import * as MILSTD from '../../../shared/2525c'
import corridor from './corridor'
import fan from './fan'
import { geometryType } from '../style/styles'

const layouts = {
  'LineString:Point': corridor,
  MultiPoint: fan
}

const defaultBehavior = (feature, descriptor) => ({
  capture: vertex => vertex,
  roles: () => ['DEFAULT'],
  geometry: () => feature.getGeometry(),
  updateCoordinates: (_, geometry, coordinates) => geometry.setCoordinates(coordinates),
  suppressVertexFeature: role => {
    if (!descriptor) return false
    if (descriptor.type === feature.getGeometry().getType() && descriptor.maxPoints === 2) return true
    return false
  }
})

export const special = feature => {
  const descriptor = MILSTD.geometry(feature.get('sidc'))
  if (!descriptor) return defaultBehavior(feature, descriptor)
  const key = geometryType(feature)

  return layouts[key]
    ? layouts[key](feature, descriptor)
    : defaultBehavior(feature, descriptor)
}
