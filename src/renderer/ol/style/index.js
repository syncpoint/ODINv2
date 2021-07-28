import { STYLE_OL_DEFAULT } from './presets'
import { StyleCache } from './StyleCache'
import pointStyles from './point-style'
import lineStringStyles from './linestring-style'
import polygonStyles from './polygon-style'

const styles = {
  ...pointStyles,
  ...lineStringStyles,
  ...polygonStyles
}

/**
 *
 */
export const featureStyle = selection => {
  const cache = new StyleCache()

  return (feature, resolution) => {
    if (!feature.getGeometry()) return null

    try {
      const key = `${feature.getGeometry().getType()}`
      return styles[key]
        ? styles[key]({
          cache,
          feature,
          resolution,
          selected: selection.isSelected(feature.getId())
        })
        : STYLE_OL_DEFAULT
    } catch (err) {
      console.error('[style]', err)
    }
  }
}
