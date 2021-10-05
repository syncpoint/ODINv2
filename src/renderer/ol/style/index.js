import { StyleCache } from './StyleCache'
import { styles } from './styles'
import { geometryType } from '../geometry'
import './point'
import './linestring'
import './polygon'
import './corridor'
import './multipoint'

/**
 *
 */
export const featureStyle = (selection, featureSource) => {

  let currentResolution
  const cache = new StyleCache()

  // When feature is removed from source, delete all matching key from cache.
  // Failing to do so, will pull out old styles when feature is re-added
  // because of undo/redo. Note: Feature revision will restart with low value,
  // which was previously used. The remainder of the key, will be the same (mode, id).
  featureSource.on('removefeature', ({ feature }) => cache.removePartial(feature.getId()))

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
        const key = geometryType(feature.getGeometry())
        const style = (styles[key] || styles.DEFAULT)({
          feature,
          resolution,
          mode,
          geometryType: key
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
