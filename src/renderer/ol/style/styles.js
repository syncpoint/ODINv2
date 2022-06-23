import * as style from 'ol/style'
import ms from 'milsymbol'
import * as Colors from './color-schemes'
import { identityCode, statusCode } from '../../symbology/2525c'
import * as patterns from './patterns'
import { PI, PI_OVER_2, PI_OVER_4 } from '../../../shared/Math'
import Props from './style-props'

const makeStyle = options => Array.isArray(options)
  ? options.map(makeStyle)
  : new style.Style(options)


const SCHEME_DEFAULT = 'medium'
const COLOR_WHITE_40 = 'rgba(255,255,255,0.4)'
const COLOR_RED_60 = 'rgba(255,0,0,0.6)'
const COLOR_CAROLINA_BLUE = '#3399CC' // https://coolors.co/3399cc
const LINE_DASH_20_10 = [20, 10]
const LINE_DASH_8_8 = [8, 8]
const LINE_DASH_10_10 = [10, 10]
const LINE_DASH_20_8_2_8 = [20, 8, 2, 8]

export const styles = {}


const makeFill = props => {
  if (Props.fillColor(props)) {
    return new style.Fill({ color: Props.fillColor(props) })
  } else if (Props.fillPattern(props)) {
    const color = patterns.fill({
      pattern: Props.fillPattern(props),
      angle: Props.fillPatternAngle(props),
      size: Props.fillPatternSize(props),
      spacing: Props.fillPatternSpacing(props),
      strokeColor: Props.lineHaloColor(props),
      strokeWidth: Props.lineHaloWidth(props) + Props.lineWidth(props),
      strokeFillColor: Props.lineColor(props),
      strokeFillWidth: Props.lineWidth(props)
    })

    return new style.Fill({ color })
  } else return null
}

const makeCircle = props => {
  const fill = new style.Fill({ color: Props.circleFillColor(props) })
  const stroke = Props.circleLineColor(props)
    ? new style.Stroke({
      color: Props.circleLineColor(props),
      width: Props.circleLineWidth(props)
    })
    : null

  return new style.Circle({
    fill,
    stroke,
    radius: Props.circleRadius(props)
  })
}

const makeShape = props => {
  const fillColor = Props.shapeFillColor(props)
  const fill = fillColor ? new style.Fill({ color: fillColor }) : null
  const stroke = new style.Stroke({ color: Props.shapeLineColor(props), width: Props.shapeLineWidth(props) })
  return new style.RegularShape({
    fill,
    stroke,
    radius: Props.shapeRadius(props),
    radius1: Props.shapeRadius1(props),
    radius2: Props.shapeRadius2(props),
    points: Props.shapePoints(props),
    angle: Props.shapeAngle(props),
    rotation: Props.shapeRotate(props),
    scale: Props.shapeScale(props),
    displacement: Props.shapeOffset(props)
  })
}

const makeSymbol = props => {
  const modes = { dark: 'Dark', medium: 'Medium', light: 'Light' }
  const size = Props.symbolSize(props) || 60 // TODO: make configurable
  const outlineColor = Props.symbolHaloColor(props)
  const outlineWidth = Props.symbolHaloWidth(props)
  const colorMode = modes[Props.symbolColorScheme(props)]
  const monoColor = Props.symbolColor(props)
  const infoSize = Props.symbolTextSize(props)
  const infoColor = Props.symbolTextColor(props)
  const strokeWidth = Props.symbolLineWidth(props)
  const fillOpacity = Props.symbolFillOpacity(props)

  const options = { ...Props.symbolModifiers(props) }

  if (outlineColor) options.outlineColor = outlineColor
  if (outlineWidth) options.outlineWidth = outlineWidth
  if (colorMode) options.colorMode = colorMode
  if (monoColor) options.monoColor = monoColor
  if (infoSize) options.infoSize = infoSize
  if (infoColor) options.infoColor = infoColor
  if (strokeWidth) options.strokeWidth = strokeWidth
  if (fillOpacity) options.fillOpacity = fillOpacity

  const symbol = new ms.Symbol(Props.symbolCode(props), { size, ...options })
  const { width, height } = symbol.getSize()

  return new style.Icon({
    anchor: [symbol.getAnchor().x, symbol.getAnchor().y],
    imgSize: [Math.floor(width), Math.floor(height)],
    img: symbol.asCanvas(),
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    scale: 0.5
  })
}

const makeIcon = props => {
  return new style.Icon({
    src: Props.iconUrl(props),
    scale: Props.iconScale(props) || 1,
    rotation: Props.iconRotate(props) || 0
  })
}

const makeImage = props => {
  if (Props.circleRadius(props)) return makeCircle(props)
  else if (Props.shapeRadius(props)) return makeShape(props)
  else if (Props.symbolCode(props)) return makeSymbol(props)
  else if (Props.iconUrl(props)) return makeIcon(props)
  else return null
}

const TEXT_ALIGN = {
  start: 'end',
  end: 'start',
  left: 'right',
  right: 'left',
  center: 'center'
}

const makeText = props => {
  if (!Props.textField(props)) return null

  const rotation = Props.textRotate(props)
  const flipped = rotation ? rotation < -PI_OVER_2 || rotation > PI_OVER_2 : false
  const textAlign = Props.textJustify(props) || null
  const textOffset = Props.textOffset(props) || [0, 0]
  const offsetX = textOffset[0]
  const offsetY = textOffset[1]

  return new style.Text({
    text: Props.textField(props),
    font: Props.textFont(props),
    rotation: rotation ? flipped ? rotation + PI : rotation : null,
    textAlign: textAlign ? flipped ? TEXT_ALIGN[textAlign] : textAlign : null,
    offsetX: flipped ? -1 * offsetX : offsetX,
    offsetY,
    padding: Props.textPadding(props) && new Array(4).fill(Props.textPadding(props)),
    fill: new style.Fill({ color: Props.textColor(props) }),
    stroke: Props.textHaloColor(props) && new style.Stroke({
      color: Props.textHaloColor(props),
      width: Props.textHaloWidth(props)
    }),
    backgroundFill: Props.textFillColor(props) && new style.Fill({ color: Props.textFillColor(props) }),
    backgroundStroke: Props.textLineColor(props) && new style.Stroke({
      color: Props.textLineColor(props),
      width: Props.textLineWidth(props)
    })
  })
}

const makeStroke = props => {
  if (!Props.lineWidth(props)) return null
  return new style.Stroke({
    color: Props.lineColor(props),
    lineCap: Props.lineCap(props),
    lineDash: Props.lineDashArray(props),
    width: Props.lineWidth(props)
  })
}


const register = defaults => ({
  'style:default': {
    'line-color': COLOR_CAROLINA_BLUE,
    'line-width': 1.25,
    'fill-color': COLOR_CAROLINA_BLUE,
    'circle-radius': 5,
    'circle-line-color': COLOR_CAROLINA_BLUE,
    'circle-line-width': 1.25,
    'circle-fill-color': COLOR_WHITE_40
  },

  'style:default-text': {
    'text-font': `${defaults.fontWeight} ${defaults.fontSize} ${defaults.fontFamily}`,
    'text-color': defaults.textFillColor,
    'text-justify': 'center',
    'text-padding': 5
  },

  'style:2525c/default-stroke': {
    'line-cap': 'square',
    'line-color': defaults.strokeFillColor,
    'line-dash-array': defaults.lineDash,
    'line-halo-color': defaults.strokeColor,
    'line-halo-dash-array': defaults.lineDash,
    'line-halo-width': 1,
    'line-width': 2
  },

  'style:2525c/solid-stroke': {
    'line-cap': 'square',
    'line-color': defaults.strokeFillColor,
    'line-halo-color': defaults.strokeColor,
    'line-halo-width': 1,
    'line-width': 2
  },

  'style:2525c/dashed-stroke': {
    'line-cap': 'square',
    'line-color': defaults.strokeFillColor,
    'line-dash-array': LINE_DASH_8_8,
    'line-halo-color': defaults.strokeColor,
    'line-halo-width': 1,
    'line-halo-dash-array': LINE_DASH_8_8,
    'line-width': 2
  },

  'style:2525c/fence-stroke': {
    'line-cap': 'square',
    'line-color': defaults.strokeSimpleFillColor,
    'line-width': 2
  },

  'style:2525c/fence-o': {
    'shape-line-color': defaults.strokeSimpleFillColor,
    'shape-line-width': 2,
    'shape-points': 8,
    'shape-radius': 8,
    'shape-radius-2': 8,
    'shape-angle': PI_OVER_4,
    'shape-scale': [0.8, 1.4]
  },

  'style:2525c/fence-x': {
    'shape-line-color': defaults.strokeSimpleFillColor,
    'shape-line-width': 2,
    'shape-points': 4,
    'shape-radius': 8,
    'shape-radius-2': 0,
    'shape-angle': PI_OVER_4,
    'shape-scale': [1, 1.4]
  },

  'style:2525c/hatch-fill': {
    'line-cap': 'square',
    'line-color': defaults.strokeFillColor,
    'line-halo-color': defaults.strokeColor,
    'line-halo-width': 1,
    'line-width': 2,
    'fill-pattern': 'hatch',
    'fill-pattern-angle': 45,
    'fill-pattern-size': 2,
    'fill-pattern-spacing': 12
  },

  'style:2525c/solid-fill': {
    'line-cap': 'square',
    'line-color': defaults.strokeFillColor,
    'line-halo-color': defaults.strokeColor,
    'line-halo-width': 1,
    'line-width': 2,
    'fill-color': defaults.fillColor,
    'fill-pattern-angle': 45,
    'fill-pattern-size': 2,
    'fill-pattern-spacing': 12
  },

  'style:circle-handle': {
    'circle-fill-color': COLOR_RED_60,
    'circle-line-color': 'white',
    'circle-line-width': 3,
    'circle-radius': 7
  },

  'style:rectangle-handle': {
    'shape-fill-color': 'white',
    'shape-line-color': 'black',
    'shape-line-width': 1,
    'shape-radius': 6,
    'shape-points': 4,
    'shape-angle': PI_OVER_4
  },

  'style:guide-stroke': {
    'line-color': 'red',
    'line-dash-array': LINE_DASH_20_8_2_8,
    'line-width': 1.5
  },

  'style:wasp-stroke': {
    'line-color': 'yellow',
    'line-width': defaults.strokeFillWidth,
    'line-dash-array': LINE_DASH_10_10,
    'line-halo-color': 'black',
    'line-halo-width': defaults.strokeWidth,
    'line-halo-dash-array': null
  }
})

/**
 *
 */
export const makeStyles = feature => {
  const sidc = feature.get('sidc')
  const identity = identityCode(sidc)
  const status = statusCode(sidc)

  const simpleIdentity = identity === 'H' || identity === 'S'
    ? 'H'
    : '-'

  const defaults = {
    strokeColor: Colors.stroke(identity),
    strokeFillColor: Colors.fill(SCHEME_DEFAULT)(identity),

    // Black or red:
    strokeSimpleFillColor: Colors.fill(SCHEME_DEFAULT)(simpleIdentity),
    lineDash: status === 'A' ? LINE_DASH_20_10 : null,
    fillColor: Colors.fill(SCHEME_DEFAULT)(identity),
    fontWeight: 'normal',
    fontSize: '12px',
    fontFamily: 'sans-serif',
    textFillColor: '#333',
    textStrokeWidth: 3,
    textStrokeColor: 'white',
    strokeWidth: 3,
    strokeFillWidth: 2
  }

  const registry = register(defaults)

  return options => {
    const styleOptions = []
    const props = { ...(registry[options.id] || {}), ...options }

    if (Props.lineHaloWidth(props)) {
      styleOptions.push({
        geometry: props.geometry,
        stroke: new style.Stroke({
          color: Props.lineHaloColor(props),
          lineDash: Props.lineHaloDashArray(props),
          lineCap: Props.lineCap(props),
          width: Props.lineWidth(props) + Props.lineHaloWidth(props)
        })
      })
    }

    styleOptions.push({
      geometry: props.geometry,
      fill: makeFill(props),
      image: makeImage(props),
      stroke: makeStroke(props),
      text: makeText(props)
    })

    return makeStyle(styleOptions)
  }
}
