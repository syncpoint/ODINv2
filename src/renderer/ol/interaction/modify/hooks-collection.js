import * as R from 'ramda'
import { getCoordinates } from '../../../model/geometry'

export default node => {
  const { feature, geometry } = node
  const featureGeometry = feature.getGeometry()

  return {
    project: R.identity,
    coordinates: coordinates => {
      const geometries = featureGeometry.getGeometriesArray()
      const index = geometries.findIndex(needle => needle === geometry)
      const xss = getCoordinates(featureGeometry)
      xss[index] = coordinates
      return xss
    }
  }
}
