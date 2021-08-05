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
      if (!styles[key]) console.log(key)
      const style = (styles[key] || styles.DEFAULT)({
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
