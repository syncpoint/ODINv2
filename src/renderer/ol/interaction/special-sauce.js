import * as MILSTD from '../../2525c'
import corridor from './corridor'

const layouts = { corridor }

const defaultBehavior = feature => ({
  capture: vertex => vertex,
  roles: () => ['DEFAULT'],
  geometry: () => feature.getGeometry(),
  updateCoordinates: (role, coordinates) => {
    feature.getGeometry().setCoordinates(coordinates)
  }
})

export const special = feature => {
  const descriptor = MILSTD.geometry(feature.get('sidc'))
  if (!descriptor || !descriptor.layout) return defaultBehavior(feature)

  return layouts[descriptor.layout]
    ? layouts[descriptor.layout](feature, descriptor)
    : defaultBehavior(feature)
}
