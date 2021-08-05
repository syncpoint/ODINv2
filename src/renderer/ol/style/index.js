import { StyleCache } from './StyleCache'
import { styles, geometryType } from './styles'
import './point'
import './linestring'
import './polygon'
import './corridor'
import './multipoint'

/**
 *
 */
export const featureStyle = selection => {
  const cache = new StyleCache()

  return (feature, resolution) => {
    try {
      const geometry = feature.getGeometry()
      const key = geometryType(geometry)

      const mode = selection.selected().length > 1
        ? 'multiple'
        : selection.isSelected(feature.getId())
          ? 'selected'
          : 'default'

      const style = (styles[key] || styles.DEFAULT)({
        cache,
        feature,
        resolution,
        mode
      })

      if (!style) return
      return Array.isArray(style) ? style.flat() : style
    } catch (err) {
      console.error('[style]', err)
    }
  }
}
