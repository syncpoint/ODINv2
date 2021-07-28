import * as MILSTD from '../../2525c'
import styleSpecs from './style-specs'
import * as Style from './primitives'

const styles = {}

styles.LineString = args => {
  const { feature } = args
  const sidc = feature.get('sidc')
  const key = MILSTD.parameterized(sidc)
  const geometry = feature.getGeometry().simplify()
  if (!geometry.getCoordinates().length) return null

  // const sizeRatio = geometry.getLength() / resolution

  if (styles[key]) {
    return styles[key](args)
  } else {
    return Style.featureStyle({
      geometry,
      properties: feature.getProperties(),
      strokes: styleSpecs['STROKES:DEFAULT'](sidc),
      texts: []
    })
  }
}

export default styles
