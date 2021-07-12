import { Style } from 'ol/style'
import { STROKE_CAROLINA_BLUE, FILL_WHITE_40 } from './presets'

const styles = {}

styles['Polygon:highest'] = () => {
  return new Style({
    stroke: STROKE_CAROLINA_BLUE,
    fill: FILL_WHITE_40
  })
}

styles['Polygon:high'] = styles['Polygon:highest']

styles['Polygon:medium'] = options => {
  const { resolution, feature } = options
  const geometry = feature.getGeometry()
  const areaRatio = geometry.getArea() / (resolution * resolution)
  if (areaRatio < 1000) return null

  return new Style({
    geometry: geometry.simplify(resolution),
    stroke: STROKE_CAROLINA_BLUE,
    fill: FILL_WHITE_40
  })
}

styles['Polygon:low'] = styles['Polygon:medium']
styles['Polygon:lowest'] = styles['Polygon:medium']

export default styles
