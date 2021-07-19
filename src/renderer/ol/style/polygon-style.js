import * as MILSTD from '../../2525c'
import styleSpecs from './style-properties'
import polygons from './polygons'
import * as Style from './primitives'
import { textPositions } from './polygons/text-positions'

const styles = {
  ...polygons
}

styles.Polygon = args => {
  const { feature, resolution } = args

  const geometry = feature.getGeometry().simplify()
  if (!geometry.getCoordinates().length) {
    console.error('missing coordinates', feature)
    return null
  }

  const sizeRatio = geometry.getArea() / (resolution * resolution)
  if (sizeRatio < 1500) return null

  const sidc = feature.get('sidc')
  const key = MILSTD.parameterized(sidc)
  const positions = textPositions(geometry)

  if (styles[key]) {
    return styles[key]({ ...args, positions })
  } else {
    return Style.featureStyle({
      geometry,
      sizeRatio,
      positions,
      properties: feature.getProperties(),
      strokes: styleSpecs['STROKES:DEFAULT'](sidc),
      texts: styleSpecs[`TEXTS:${key}`] || styleSpecs['TEXTS:DEFAULT']
    })
  }
}

export default styles
