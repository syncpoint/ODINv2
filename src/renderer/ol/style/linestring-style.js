import * as MILSTD from '../../2525c'
import styleSpecs from './style-properties'
import * as Style from './primitives'

const styles = {}

styles.LineString = args => {
  const { resolution, feature } = args
  const sidc = feature.get('sidc')
  const key = MILSTD.parameterized(sidc)
  const geometry = feature.getGeometry().simplify()
  const lengthRatio = geometry.getLength() / resolution
  if (lengthRatio < 250) return null

  if (styles[key]) {
    return styles[key](args)
  } else {
    return Style.featureStyle({
      geometry,
      lengthRatio,
      properties: feature.getProperties(),
      strokes: styleSpecs['STROKES:DEFAULT'](sidc),
      texts: []
    })
  }
}

export default styles
