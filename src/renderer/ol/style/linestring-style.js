import { Style } from 'ol/style'
import { STROKE_CAROLINA_BLUE } from './presets'

const styles = {}

styles['LineString:highest'] = () => {
  return new Style({ stroke: STROKE_CAROLINA_BLUE })
}

styles['LineString:high'] = styles['LineString:highest']

styles['LineString:medium'] = ({ resolution, feature }) => {
  const geometry = feature.getGeometry()
  const lengthRatio = geometry.getLength() / resolution
  if (lengthRatio < 250) return null

  return new Style({
    geometry: geometry.simplify(),
    stroke: STROKE_CAROLINA_BLUE
  })
}

styles['LineString:low'] = styles['LineString:medium']
styles['LineString:lowest'] = styles['LineString:medium']

export default styles
