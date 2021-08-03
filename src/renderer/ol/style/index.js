import { StyleCache } from './StyleCache'
import { styles, geometryType } from './styles'
import './point'
import './linestring'
import './polygon'
import './corridor'

/**
 *
 */
export const featureStyle = selection => {
  const cache = new StyleCache()

  return (feature, resolution) => {
    try {
      const geometry = feature.getGeometry()
      return (styles[geometryType(geometry)] || styles.DEFAULT)({
        cache,
        feature,
        geometry,
        resolution,
        selected: selection.isSelected(feature.getId())
      })
    } catch (err) {
      console.error('[style]', err)
    }
  }
}
