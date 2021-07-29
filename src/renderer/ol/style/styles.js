import * as R from 'ramda'
import { Fill, Stroke, Circle, Style, Text } from 'ol/style'
import { Jexl } from 'jexl'
import * as Colors from './color-schemes'
import * as MILSTD from '../../2525c'

export const jexl = new Jexl()
export const stroke = options => new Stroke(options)
export const style = options => new Style(options)
export const text = options => new Text(options)
export const circle = options => new Circle(options)
export const fill = options => new Fill(options)


// 8cbb6c2e-7637-4603-9d2c-dd59b8252ea4 - preferences/project: color scheme (dark, medium, light)
const scheme = 'medium'


export const styles = {}

const COLOR_WHITE_40 = 'rgba(255,255,255,0.4)'
const COLOR_CAROLINA_BLUE = '#3399CC' // https://coolors.co/3399cc
const FILL_WHITE_40 = new Fill({ color: COLOR_WHITE_40 })
const STROKE_CAROLINA_BLUE = new Stroke({ color: COLOR_CAROLINA_BLUE, width: 1.25 })

styles.DEFAULT = (() => {
  const fill = FILL_WHITE_40
  const stroke = STROKE_CAROLINA_BLUE
  const image = circle({ fill, stroke, radius: 5 })
  return style({ image, fill, stroke })
})()

styles['STROKES:DEFAULT'] = sidc => {
  // Order matters: Thicker stroke first, thinner stroke (fill) last.
  const standardIdentity = MILSTD.standardIdentity(sidc)
  const lineDash = MILSTD.status(sidc) === 'A' ? [20, 10] : null
  return [
    { color: Colors.stroke(standardIdentity), width: 3, lineDash },
    { color: Colors.fill(scheme)(standardIdentity), width: 2, lineDash }
  ]
}

styles['STROKES:SOLID'] = sidc => {
  // Order matters: Thicker stroke first, thinner stroke (fill) last.
  const standardIdentity = MILSTD.standardIdentity(sidc)
  return [
    { color: Colors.stroke(standardIdentity), width: 3 },
    { color: Colors.fill(scheme)(standardIdentity), width: 2 }
  ]
}

styles.LABEL = ({ placement, properties }) => label => {
  const fontSize = label.fontSize || '10pt'

  const lines = Array.isArray(label.text)
    ? label.text.map(text => jexl.evalSync(text, properties)).filter(R.identity).join('\n')
    : jexl.evalSync(label.text, properties)

  return new Style({
    geometry: placement[label.position].apply(),
    // TODO: 245decd7-2865-43e7-867d-2133889750b9 - style (layer/feature): font (size, color, etc.)
    text: new Text({
      text: lines,
      font: `${fontSize} sans-serif`,
      stroke: stroke({ color: 'white', width: 2 }),
      textAlign: label.align || 'center',
      offsetX: label.offsetX,
      offsetY: label.offsetY
    })
  })
}

styles.FEATURE = options => {
  const { strokes, geometry, texts } = options
  return [
    ...strokes.map(options => style({ geometry, stroke: stroke(options) })),
    ...texts.flat().map(styles.LABEL(options))
  ]
}

