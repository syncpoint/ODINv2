import { Polygon } from './PolygonStyle'
import { LineString } from './LineStringStyle'
import { baseStyle } from './baseStyle'

export const STYLES = {
  Polygon,
  LineString
}

export const styleFN = (isSelected) => {
  return feature => {
    const geometry = feature.getGeometry()
    const geometryType = geometry.getType()
    return [
      ...baseStyle(isSelected(feature)),
      ...STYLES[geometryType](geometry)
    ]
  }
}
