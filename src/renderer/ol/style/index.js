import * as MILSTD from '../../2525c'
import { StyleCache } from './StyleCache'
import { styles } from './styles'
import './point'
import './linestring'
import './polygon'

const styleFactory = feature => {
  const sidc = MILSTD.parameterized(feature.get('sidc'))
  const geometryType = feature.getGeometry().getType()

  if (styles[`${geometryType}:${sidc}`]) return styles[`${geometryType}:${sidc}`]
  else if (styles[`${geometryType}`]) return styles[`${geometryType}`]
  else return styles.DEFAULT
}

/**
 *
 */
export const featureStyle = selection => {
  const cache = new StyleCache()

  return (feature, resolution) => {
    if (!feature.getGeometry()) return null

    try {
      return styleFactory(feature)({
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
