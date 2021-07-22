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

    const key = `${feature.getGeometry().getType()}`
    if (!styles[key]) return null

    try {
      return styles[key]({
        cache,
        feature,
        resolution,
        selected: selection.isSelected(feature.getId())
      })
    } catch (err) {
      console.error('[style]', err)
    }
  }
}
