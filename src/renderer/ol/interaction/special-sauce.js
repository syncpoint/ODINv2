import * as MILSTD from '../../2525c'
import corridor from './corridor'

const layouts = { corridor }

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
  if (!descriptor || !descriptor.layout) return defaultBehavior(feature, descriptor)

  return layouts[descriptor.layout]
    ? layouts[descriptor.layout](feature, descriptor)
    : defaultBehavior(feature, descriptor)
}
