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
  let currentResolution
  const cache = new StyleCache()

  return (feature, resolution) => {

    // Reset cache on resolution change:
    if (resolution !== currentResolution) {
      currentResolution = resolution
      cache.clear()
    }

    try {
      const mode = selection.isSelected(feature.getId())
        ? selection.selected().length > 1
          ? 'multiple'
          : 'selected'
        : 'default'

      const style = () => {
        const styleKey = geometryType(feature.getGeometry())
        const style = (styles[styleKey] || styles.DEFAULT)({
          feature,
          resolution,
          mode
        })

        if (!style) return
        return Array.isArray(style) ? style.flat() : style
      }

      const cacheKey = `${feature.getRevision()}:${mode}:${feature.getId()}`
      return cache.entry(cacheKey, style)
    } catch (err) {
      console.error('[style]', err, feature)
    }
  }
}
