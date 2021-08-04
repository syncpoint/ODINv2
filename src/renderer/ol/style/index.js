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
      const style = (styles[geometryType(geometry)] || styles.DEFAULT)({
        cache,
        feature,
        resolution,
        selected: selection.isSelected(feature.getId())
      })

      if (!style) return
      return Array.isArray(style) ? style.flat() : style
    } catch (err) {
      console.error('[style]', err)
    }
  }
}
