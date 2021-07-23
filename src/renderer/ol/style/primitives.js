import * as R from 'ramda'
import { Style, Stroke, Text } from 'ol/style'
import { Jexl } from 'jexl'

export const jexl = new Jexl()

export const stroke = options => new Stroke(options)
export const style = options => new Style(options)
export const text = options => new Text(options)

export const textStyle = (positions, properties) => label => {
  const fontSize = label.fontSize || '10pt'

  const lines = Array.isArray(label.text)
    ? label.text.map(text => jexl.evalSync(text, properties)).filter(R.identity).join('\n')
    : jexl.evalSync(label.text, properties)

  return style({
    geometry: positions[label.position].apply(),
    // TODO: 245decd7-2865-43e7-867d-2133889750b9 - style (layer/feature): font (size, color, etc.)
    text: text({
      text: lines,
      font: `${fontSize} sans-serif`,
      stroke: new Stroke({ color: 'white', width: 2 }),
      textAlign: label.align || 'center',
      offsetX: label.offsetX,
      offsetY: label.offsetY
    })
  })
}

/**
 * Feature style from style properties.
 */
export const featureStyle = options => {
  const { strokes, properties, geometry, texts, positions } = options
  return [
    ...strokes.map(options => style({ geometry, stroke: stroke(options) })),
    ...texts.flat().map(textStyle(positions, properties))
  ]
}
