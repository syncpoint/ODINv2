import { styles } from '../styles'
import { createEchelon } from '../echelons'

// BOUNDARIES
styles['LineString:G*G*GLB---'] = ({ feature, styles, resolution, lineString }) => {
  const sidc = feature.get('sidc')
  const echelon = createEchelon({ sidc, resolution, geometry: lineString })

  return [
    styles.defaultStroke(echelon.geometry),
    ...(echelon.icon ? [echelon.icon] : [])
  ]
}
