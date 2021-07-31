import * as R from 'ramda'
import { Fill, Stroke, Circle, Style, Text } from 'ol/style'
import * as Colors from './color-schemes'
import * as MILSTD from '../../2525c'
import { geometryLabels } from './labels'

export const stroke = options => new Stroke(options)
export const style = options => new Style(options)
export const text = options => new Text(options)
export const circle = options => new Circle(options)
export const fill = options => new Fill(options)


// 8cbb6c2e-7637-4603-9d2c-dd59b8252ea4 - preferences/project: color scheme (dark, medium, light)
const SCHEME_DEFAULT = 'medium'
const COLOR_WHITE_40 = 'rgba(255,255,255,0.4)'
const COLOR_CAROLINA_BLUE = '#3399CC' // https://coolors.co/3399cc
const FILL_WHITE_40 = new Fill({ color: COLOR_WHITE_40 })
const STROKE_CAROLINA_BLUE = new Stroke({ color: COLOR_CAROLINA_BLUE, width: 1.25 })
const LINE_DASH_DEFAULT = [20, 10]

const STYLE_OL = style({
  image: circle({
    fill: FILL_WHITE_40,
    stroke: STROKE_CAROLINA_BLUE,
    radius: 5
  }),
  fill: FILL_WHITE_40,
  stroke: STROKE_CAROLINA_BLUE
})

export const styles = {}

styles.DEFAULT = () => STYLE_OL

styles['STROKES:DEFAULT'] = sidc => {
  // Order matters: Thicker stroke first, thinner stroke (fill) last.
  const standardIdentity = MILSTD.standardIdentity(sidc)
  const lineDash = MILSTD.status(sidc) === 'A' ? LINE_DASH_DEFAULT : null
  return [
    { color: Colors.stroke(standardIdentity), width: 3, lineDash },
    { color: Colors.fill(SCHEME_DEFAULT)(standardIdentity), width: 2, lineDash }
  ]
}

styles['STROKES:SOLID'] = sidc => {
  // Order matters: Thicker stroke first, thinner stroke (fill) last.
  const standardIdentity = MILSTD.standardIdentity(sidc)
  return [
    { color: Colors.stroke(standardIdentity), width: 3 },
    { color: Colors.fill(SCHEME_DEFAULT)(standardIdentity), width: 2 }
  ]
}

styles['STROKES:DASHED'] = (sidc, options = {}) => {
  // Order matters: Thicker stroke first, thinner stroke (fill) last.
  const standardIdentity = MILSTD.standardIdentity(sidc)
  const lineDash = options.lineDash || LINE_DASH_DEFAULT
  return [
    { color: Colors.stroke(standardIdentity), width: 3, lineDash },
    { color: Colors.fill(SCHEME_DEFAULT)(standardIdentity), width: 2, lineDash }
  ]
}

styles['STROKES:FILLED'] = sidc => {
  // Order matters: Thicker stroke first, thinner stroke (fill) last.
  const standardIdentity = MILSTD.standardIdentity(sidc)
  const fillColor = Colors.fill(SCHEME_DEFAULT)(standardIdentity)
  return [
    { color: Colors.stroke(standardIdentity), width: 3 },
    { color: fillColor, width: 2, fill: { color: fillColor } }
  ]
}

styles.FEATURE = options => {
  const { strokes, geometry, properties } = options
  const labels = options.labels || geometryLabels(geometry, properties)
  const texts = options.texts || []
  return [
    ...strokes.map(options => style({ geometry, stroke: stroke(options) })),
    ...texts.flat().map(text => labels.label(text)).filter(R.identity)
  ]
}

