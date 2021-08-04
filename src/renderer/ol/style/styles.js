import Feature from 'ol/Feature'
import Geometry from 'ol/geom/Geometry'
import GeometryCollection from 'ol/geom/GeometryCollection'
import { Fill, Stroke, Circle, Style, Text } from 'ol/style'
import * as Colors from './color-schemes'
import * as MILSTD from '../../2525c'
import { geometryLabels } from './labels'

export const stroke = options => new Stroke(options)
export const style = options => new Style(options)
export const text = options => new Text(options)
export const circle = options => new Circle(options)
export const fill = options => new Fill(options)

export const geometryType = arg => {
  if (arg instanceof Feature) return geometryType(arg.getGeometry())
  else if (arg instanceof GeometryCollection) return arg.getGeometries().map(geometryType).join(':')
  else if (arg instanceof Geometry) return arg.getType()
  else return null
}

// 8cbb6c2e-7637-4603-9d2c-dd59b8252ea4 - preferences/project: color scheme (dark, medium, light)
const SCHEME_DEFAULT = 'medium'
const COLOR_WHITE_40 = 'rgba(255,255,255,0.4)'
const COLOR_CAROLINA_BLUE = '#3399CC' // https://coolors.co/3399cc
const FILL_WHITE_40 = fill({ color: COLOR_WHITE_40 })
const STROKE_CAROLINA_BLUE = stroke({ color: COLOR_CAROLINA_BLUE, width: 1.25 })
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

export const properties = {}

properties['2525C'] = arg => {
  if (!arg) return null
  if (arg instanceof Feature) return properties['2525C'](arg.get('sidc'))
  if (!(typeof arg === 'string')) return null

  const sidc = arg
  const standardIdentity = MILSTD.standardIdentity(sidc)
  const status = MILSTD.status(sidc)

  return {
    strokeColor: Colors.stroke(standardIdentity),
    strokeFillColor: Colors.fill(SCHEME_DEFAULT)(standardIdentity),
    lineDash: status === 'A' ? LINE_DASH_DEFAULT : null,
    fillColor: Colors.fill(SCHEME_DEFAULT)(standardIdentity)
  }
}

properties.STROKE = options => arg => {
  const props = { ...properties['2525C'](arg), ...options }
  return [
    { color: props.strokeColor, width: 3, lineDash: props.lineDash },
    { color: props.strokeFillColor, width: 2, lineDash: props.lineDash }
  ]
}

properties['STROKE:FILLED'] = options => arg => {
  const props = { ...properties['2525C'](arg), ...options }
  return [
    { color: props.strokeColor, width: 3 },
    { color: props.strokeFillColor, width: 2, fillColor: props.fillColor }
  ]
}

properties['STROKE:SOLID'] = options => arg => {
  const props = { ...properties['2525C'](arg), ...options }
  return [
    { color: props.strokeColor, width: 3 },
    { color: props.strokeFillColor, width: 2 }
  ]
}

export const styles = {}

styles.DEFAULT = () => STYLE_OL

styles.defaultStroke = (options = {}, geometry = null) => arg => {
  return properties.STROKE(options)(arg)
    .map(props => style({ geometry, stroke: stroke(props) }))
}

styles.filledStroke = (options = {}, geometry = null) => arg => {
  return properties['STROKE:FILLED'](options)(arg)
    .map(props => style({
      geometry,
      stroke: stroke(props),
      fill: props.fillColor ? fill({ color: props.fillColor }) : null
    }))
}

styles.dashedStroke = (options = {}, geometry = null) => arg => {
  return properties.STROKE({ lineDash: [8, 8], ...options })(arg)
    .map(props => style({ geometry, stroke: stroke(props) }))
}

styles.solidStroke = (options = {}, geometry = null) => arg => {
  return properties['STROKE:SOLID'](options)(arg)
    .map(props => style({ geometry, stroke: stroke(props) }))
}

styles.text = (options, geometry) => {
  const flip = α => α > Math.PI / 2 && α < 3 * Math.PI / 2
  const textAlign = options.flip
    ? options.textAlign && options.textAlign(flip(options.rotation))
    : options.textAlign

  const rotation = options.flip
    ? flip(options.rotation)
      ? options.rotation - Math.PI
      : options.rotation
    : options.rotation

  const offsetX = options.flip
    ? options.offsetX && options.offsetX(flip(options.rotation))
    : options.offsetX

  // TODO: 245decd7-2865-43e7-867d-2133889750b9 - style (layer/feature): font (size, color, etc.)
  const fontSize = options.fontSize || '10pt'
  const fontFamily = 'sans-serif'

  return style({
    geometry,
    text: text({
      ...options,
      font: `${fontSize} ${fontFamily}`,
      stroke: new Stroke({ color: 'white', width: 2 }),
      textAlign,
      rotation,
      offsetX
    })
  })
}

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

styles.TEXT = ({ geometry, options }) => {
  const flip = α => α > Math.PI / 2 && α < 3 * Math.PI / 2
  const textAlign = options.flip
    ? options.textAlign && options.textAlign(flip(options.rotation))
    : options.textAlign

  const rotation = options.flip
    ? flip(options.rotation)
      ? options.rotation - Math.PI
      : options.rotation
    : options.rotation

  const offsetX = options.flip
    ? options.offsetX && options.offsetX(flip(options.rotation))
    : options.offsetX

  // TODO: 245decd7-2865-43e7-867d-2133889750b9 - style (layer/feature): font (size, color, etc.)
  const fontSize = options.fontSize || '10pt'
  const fontFamily = 'sans-serif'

  return style({
    geometry,
    text: text({
      ...options,
      font: `${fontSize} ${fontFamily}`,
      stroke: new Stroke({ color: 'white', width: 2 }),
      textAlign,
      rotation,
      offsetX
    })
  })
}

styles.FEATURE = options => {
  const { strokes, geometry, properties } = options
  const labels = options.labels || geometryLabels(geometry, properties)
  const texts = (options.texts || []).flat()
    .map(labels.label.bind(labels))
    .map(styles.TEXT)

  return [
    ...strokes.map(options => style({ geometry, stroke: stroke(options) })),
    ...texts
  ]
}
