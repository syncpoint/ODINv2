import { StyleCache } from './StyleCache'
import pointStyles from './point-style'
import lineStringStyles from './linestring-style'
import polygonStyles from './polygon-style'

const DETAIL_HIGHEST = 'highest'
const DETAIL_HIGH = 'high'
const DETAIL_MEDIUM = 'medium'
const DETAIL_LOW = 'low'
const DETAIL_LOWEST = 'lowest'

const styles = {
  ...pointStyles,
  ...lineStringStyles,
  ...polygonStyles
}

const detail = resolution => {
  /* eslint-disable no-multi-spaces */
  if (resolution < 13) return DETAIL_HIGHEST       // <  1 :    25.000
  else if (resolution < 30) return DETAIL_HIGH     // <  1 :    50.000
  else if (resolution < 135) return DETAIL_MEDIUM  // <  1 :   250.000
  else if (resolution < 530) return DETAIL_LOW     // <  1 : 1.000.000
  else return DETAIL_LOWEST                        // >= 1 : 1.000.000
  /* eslint-enable no-multi-spaces */
}

/**
 *
 */
export const featureStyle = selection => {
  const cache = new StyleCache()

  return (feature, resolution) => {
    if (!feature.getGeometry()) return null

    const key = `${feature.getGeometry().getType()}:${detail(resolution)}`
    if (!styles[key]) return null

    // TODO: handle possible style errors

    return styles[key]({
      cache,
      feature,
      resolution,
      selected: selection.isSelected(feature.getId())
    })
  }
}
