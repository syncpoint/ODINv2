import * as R from 'ramda'
import * as geom from 'ol/geom'
import * as Style from 'ol/style'
import ms from 'milsymbol'
import * as Colors from './color-schemes'
import { identityCode, statusCode } from '../../symbology/2525c'
import * as patterns from './patterns'
import { PI, PI_OVER_2, PI_OVER_4 } from '../../../shared/Math'

const makeStroke = options => new Style.Stroke(options)
const makeText = options => new Style.Text(options)
const makeCircle = options => new Style.Circle(options)
const makeFill = options => new Style.Fill(options)
const makeRegularShape = options => new Style.RegularShape(options)
const makeIcon = options => new Style.Icon(options)
const makeStyle = options => Array.isArray(options)
  ? options.map(makeStyle)
  : new Style.Style(options)


const SCHEME_DEFAULT = 'medium'
const COLOR_WHITE_40 = 'rgba(255,255,255,0.4)'
const COLOR_RED_60 = 'rgba(255,0,0,0.6)'
const COLOR_CAROLINA_BLUE = '#3399CC' // https://coolors.co/3399cc
const FILL_WHITE_100 = makeFill({ color: 'white' })
const FILL_WHITE_40 = makeFill({ color: COLOR_WHITE_40 })
const FILL_RED_60 = makeFill({ color: COLOR_RED_60 })
const STROKE_CAROLINA_BLUE = makeStroke({ color: COLOR_CAROLINA_BLUE, width: 1.25 })
const STROKE_WHITE_3 = makeStroke({ color: 'white', width: 3 })
const STROKE_BLACK_1 = makeStroke({ color: 'black', width: 1 })
const LINE_DASH_20_10 = [20, 10]
const LINE_DASH_8_8 = [8, 8]
const LINE_DASH_10_10 = [10, 10]
const LINE_DASH_20_8_2_8 = [20, 8, 2, 8]

export const styles = {}

styles.DEFAULT = () => makeStyle({
  image: makeCircle({
    fill: FILL_WHITE_40,
    stroke: STROKE_CAROLINA_BLUE,
    radius: 5
  }),
  fill: FILL_WHITE_40,
  stroke: STROKE_CAROLINA_BLUE
})

const HANDLE_MULTI_SELECT = makeRegularShape({
  fill: FILL_WHITE_100,
  stroke: STROKE_BLACK_1,
  radius: 6,
  points: 4,
  angle: PI_OVER_4
})

const HANDLE_SINGLE_SELECT = makeCircle({
  fill: FILL_RED_60,
  stroke: STROKE_WHITE_3,
  radius: 7
})

export const Props = {
  circleFillColor: R.prop('circle-fill-color'),
  circleLineColor: R.prop('circle-line-color'),
  circleLineWidth: R.prop('circle-line-width'),
  circleRadius: R.prop('circle-radius'),

  fillColor: R.prop('fill-color'),
  fillPattern: R.prop('fill-pattern'),
  fillPatternAngle: R.prop('fill-pattern-angle'),
  fillPatternSize: R.prop('fill-pattern-size'),
  fillPatternSpacing: R.prop('fill-pattern-spacing'),

  iconAnchor: R.prop('icon-anchor'),
  iconHeight: R.prop('icon-height'),
  iconImage: R.prop('icon-image'),
  iconPadding: R.prop('icon-padding'),
  iconRotate: R.prop('icon-rotate'),
  iconScale: R.prop('icon-scale'),
  iconUrl: R.prop('icon-url'),
  iconWidth: R.prop('icon-width'),

  lineCap: R.prop('line-cap'),
  lineColor: R.prop('line-color'),
  lineDashArray: R.prop('line-dash-array'),
  lineHaloColor: R.prop('line-halo-color'),
  lineHaloWidth: R.prop('line-halo-width'),
  lineWidth: R.prop('line-width'),

  textAnchor: R.prop('text-anchor'),
  textClipping: R.prop('text-clipping'),
  textColor: R.prop('text-color'),
  textField: R.prop('text-field'),
  textFillColor: R.prop('text-fill-color'),
  textFont: R.prop('text-font'),
  textHaloColor: R.prop('text-halo-color'),
  textHaloWidth: R.prop('text-halo-width'),
  textJustify: R.prop('text-justify'),
  textLineColor: R.prop('text-line-color'),
  textLineWidth: R.prop('text-line-width'),
  textOffset: R.prop('text-offset'),
  textPadding: R.prop('text-padding'),
  textRotate: R.prop('text-rotate'),

  shapeAngle: R.prop('shape-angle'),
  shapeFillColor: R.prop('shape-fill-color'),
  shapeLineColor: R.prop('shape-line-color'),
  shapeLineWidth: R.prop('shape-line-width'),
  shapeOffset: R.prop('shape-offset'),
  shapePoints: R.prop('shape-points'),
  shapeRadius: R.prop('shape-radius'),
  shapeRadius1: R.prop('shape-radius-1'),
  shapeRadius2: R.prop('shape-radius-2'),
  shapeRotate: R.prop('shape-rotate'),
  shapeScale: R.prop('shape-scale'),

  symbolAnchor: R.prop('symbol-anchor'),
  symbolColor: R.prop('symbol-color'),
  symbolHaloColor: R.prop('symbol-halo-color'),
  symbolHaloWidth: R.prop('symbol-halo-width'),
  symbolOffset: R.prop('symbol-offset'),
  symbolRotate: R.prop('symbol-rotate'),
  symbolSIDC: R.prop('symbol-sidc'),
  symbolSize: R.prop('symbol-size')
}

/**
 *
 */
export const makeStyles = (feature, mode = 'default') => {
  const sidc = feature.get('sidc')
  const identity = identityCode(sidc)
  const status = statusCode(sidc)

  const defaults = {
    strokeColor: Colors.stroke(identity),
    strokeFillColor: Colors.fill(SCHEME_DEFAULT)(identity),
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

  const registry = {}

  registry['style:default'] = {
    'line-color': COLOR_CAROLINA_BLUE,
    'line-width': 1.25,
    'fill-color': COLOR_CAROLINA_BLUE,
    'circle-radius': 5,
    'circle-line-color': COLOR_CAROLINA_BLUE,
    'circle-line-width': 1.25,
    'circle-fill-color': COLOR_WHITE_40
  }

  registry['style:default-text'] = {
    'text-font': `${defaults.fontWeight} ${defaults.fontSize} ${defaults.fontFamily}`,
    'text-color': defaults.textFillColor,
    'text-justify': 'center',
    'text-padding': 5
  }

  registry['style:2525c/default-stroke'] = {
    'line-cap': 'square',
    'line-color': Colors.fill(SCHEME_DEFAULT)(identity),
    'line-dash-array': status === 'A' ? LINE_DASH_20_10 : null,
    'line-halo-color': Colors.stroke(identity),
    'line-halo-width': 1,
    'line-width': 2
  }

  registry['style:2525c/solid-stroke'] = {
    'line-cap': 'square',
    'line-color': Colors.fill(SCHEME_DEFAULT)(identity),
    'line-halo-color': Colors.stroke(identity),
    'line-halo-width': 1,
    'line-width': 2
  }

  registry['style:2525c/dashed-stroke'] = {
    'line-cap': 'square',
    'line-color': Colors.fill(SCHEME_DEFAULT)(identity),
    'line-dash-array': LINE_DASH_8_8,
    'line-halo-color': Colors.stroke(identity),
    'line-halo-width': 1,
    'line-width': 2
  }

  registry['style:2525c/fence-stroke'] = {
    'line-cap': 'square',
    'line-color': 'black',
    'line-width': 3
  }

  registry['style:2525c/hatch-fill'] = {
    'line-cap': 'square',
    'line-color': Colors.fill(SCHEME_DEFAULT)(identity),
    'line-halo-color': Colors.stroke(identity),
    'line-halo-width': 1,
    'line-width': 2,
    'fill-pattern': 'hatch',
    'fill-pattern-angle': 45,
    'fill-pattern-size': 2,
    'fill-pattern-spacing': 12
  }

  registry['style:2525c/solid-fill'] = {
    'line-cap': 'square',
    'line-color': Colors.fill(SCHEME_DEFAULT)(identity),
    'line-halo-color': Colors.stroke(identity),
    'line-halo-width': 1,
    'line-width': 2,
    'fill-color': Colors.fill(SCHEME_DEFAULT)(identity),
    'fill-pattern-angle': 45,
    'fill-pattern-size': 2,
    'fill-pattern-spacing': 12
  }

  registry['style:circle-handle'] = {
    'circle-fill-color': COLOR_RED_60,
    'circle-line-color': 'white',
    'circle-line-width': 3,
    'circle-radius': 7
  }

  registry['style:rectangle-handle'] = {
    'shape-fill-color': 'white',
    'shape-line-color': 'black',
    'shape-line-width': 1,
    'shape-radius': 6,
    'shape-points': 4,
    'shape-angle': PI_OVER_4
  }

  registry['style:guide-stroke'] = {
    'line-color': 'red',
    'line-dash-array': LINE_DASH_20_8_2_8,
    'line-width': 1.5
  }

  const styles = {}

  styles.lineStyle = (geometry, props) => {
    const styleOptions = []

    if (props['line-halo-color']) {
      styleOptions.push({
        geometry,
        stroke: makeStroke({
          color: props['line-halo-color'],
          lineDash: props['line-dash-array'],
          lineCap: props['line-cap'],
          width: props['line-width'] + props['line-halo-width']
        })
      })
    }

    styleOptions.push({
      // TODO: fill pattern
      geometry,
      stroke: makeStroke({
        color: props['line-color'],
        lineCap: props['line-cap'],
        lineDash: props['line-dash-array'],
        width: props['line-width']
      })
    })

    return makeStyle(styleOptions)
  }

  styles.font = (options = {}) => {
    const fontWeight = options.fontWeight || defaults.fontWeight
    const fontSize = options.fontSize || defaults.fontSize
    const fontFamily = options.fontFamily || defaults.fontFamily
    return options.font || `${fontWeight} ${fontSize} ${fontFamily}`
  }

  const TEXT_ALIGN = {
    start: 'end',
    end: 'start',
    left: 'right',
    right: 'left',
    center: 'center'
  }

  const textOptions = options => {
    const { text, rotation, textAlign, offsetX, offsetY } = options
    const flipped = rotation ? rotation < -PI_OVER_2 || rotation > PI_OVER_2 : false

    return {
      text,
      font: styles.font(options),
      overflow: true,

      // Adjust some options depending on rotation angle:
      rotation: rotation ? flipped ? rotation + PI : rotation : null,
      textAlign: textAlign ? flipped ? TEXT_ALIGN[textAlign] : textAlign : null,
      offsetX: offsetX ? flipped ? -1 * offsetX : offsetX : 0,
      offsetY: offsetY || 0,
      padding: options.padding,
      fill: options.fill,
      stroke: options.stroke,
      backgroundFill: options.backgroundFill,
      backgroundStroke: options.backgroundStroke
    }
  }

  const symbolOptions = (options) => {
    const size = 60 // TODO: make configurable
    const symbol = new ms.Symbol(options.sidc, { ...options, size })
    const { width, height } = symbol.getSize()

    return {
      anchor: [symbol.getAnchor().x, symbol.getAnchor().y],
      imgSize: [Math.floor(width), Math.floor(height)],
      img: symbol.asCanvas(),
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: 0.5
    }
  }

  /**
   *
   */
  styles.labels = (labelOptions = []) => {
    return labelOptions.map(options => {
      if (options.textOptions) {
        const text = makeText(textOptions(options.textOptions))
        return makeStyle({ geometry: options.geometry, text })
      } else {
        const image = makeIcon(symbolOptions(options.symbolOptions))
        return makeStyle({ geometry: options.geometry, image })
      }
    })
  }

  styles.label = label => {
    const rotation = Props.textRotate(label)
    const flipped = rotation ? rotation < -PI_OVER_2 || rotation > PI_OVER_2 : false
    const textAlign = Props.textJustify(label) || null
    const textOffset = Props.textOffset(label) || [0, 0]
    const offsetX = textOffset[0]
    const offsetY = textOffset[1]

    const options = {
      text: Props.textField(label),
      font: Props.textFont(label),
      rotation: rotation ? flipped ? rotation + PI : rotation : null,
      textAlign: textAlign ? flipped ? TEXT_ALIGN[textAlign] : textAlign : null,
      offsetX: flipped ? -1 * offsetX : offsetX,
      offsetY: offsetY,
      padding: Props.textPadding(label) && new Array(4).fill(Props.textPadding(label)),
      fill: new Style.Fill({ color: Props.textColor(label) }),
      stroke: Props.textHaloColor(label) && new Style.Stroke({
        color: Props.textHaloColor(label),
        width: Props.textHaloWidth(label)
      }),
      backgroundFill: Props.textFillColor(label) && new Style.Fill({ color: Props.textFillColor(label) }),
      backgroundStroke: Props.textLineColor(label) && new Style.Stroke({
        color: Props.textLineColor(label),
        width: Props.textLineWidth(label)
      })
    }

    const text = makeText(options)
    return makeStyle({ geometry: label.geometry, text })
  }

  styles.text = (geometry, options = {}) => {
    const text = makeText(textOptions(options))
    return [makeStyle({ geometry, text })]
  }

  styles.outlinedText = (geometry, options = {}) => {
    const textStrokeWidth = options.textStrokeWidth || defaults.textStrokeWidth
    const textStrokeColor = options.textStrokeColor || defaults.textStrokeColor
    const textFillColor = options.textFillColor || defaults.textFillColor

    const text = makeText({
      ...textOptions(options),
      stroke: makeStroke({ width: textStrokeWidth, color: textStrokeColor }),
      fill: makeFill({ color: textFillColor })
    })

    return [makeStyle({ geometry, text })]
  }

  styles.symbol = (geometry, options) => {
    const image = makeIcon(symbolOptions({ ...options, sidc }))
    return makeStyle({ geometry, image })
  }

  /**
   *
   */
  styles.handles = geometry => {
    const styleOptions = {
      multiple: [{
        geometry: new geom.Point(geometry.getFirstCoordinate()),
        image: HANDLE_MULTI_SELECT
      }],
      selected: [{
        geometry,
        image: HANDLE_SINGLE_SELECT
      }]
    }

    return makeStyle(styleOptions[mode] || [])
  }

  const strokeStyle = (geometry, options) => options
    .map(options => ({ geometry, stroke: makeStroke(options) }))
    .map(makeStyle)


  styles.defaultStroke = (geometry, options = {}) => {
    const fill = options.fillPattern && patterns.fill({
      ...defaults, ...options.fillPattern
    })

    const styleOptions = [
      {
        geometry,
        stroke: makeStroke({
          color: defaults.strokeColor,
          width: defaults.strokeWidth,
          lineDash: defaults.lineDash
        })
      },
      {
        geometry,
        stroke: makeStroke({
          color: defaults.strokeFillColor,
          width: defaults.strokeFillWidth,
          lineDash: defaults.lineDash
        }),
        fill: fill && makeFill({ color: fill })
      }
    ]

    return makeStyle(styleOptions)
  }

  /**
   *
   */
  styles.solidStroke = geometry => {
    const strokeOptions = [
      { color: defaults.strokeColor, width: defaults.strokeWidth },
      { color: defaults.strokeFillColor, width: defaults.strokeFillWidth }
    ]

    return strokeStyle(geometry, strokeOptions)
  }

  /**
   *
   */
  styles.dashedStroke = (geometry, options = {}) => {
    const lineDash = options.lineDash || LINE_DASH_8_8
    const strokeOptions = [
      { color: defaults.strokeColor, width: defaults.strokeWidth, lineDash },
      { color: defaults.strokeFillColor, width: defaults.strokeFillWidth, lineDash }
    ]

    return strokeStyle(geometry, strokeOptions)
  }

  /**
   *
   */
  styles.waspStroke = geometry => {
    const strokeOptions = [
      { color: 'black', width: defaults.strokeWidth },
      { color: 'yellow', width: defaults.strokeFillWidth, lineDash: LINE_DASH_10_10 }
    ]

    return strokeStyle(geometry, strokeOptions)
  }

  /**
   *
   */
  styles.guideStroke = geometry => {
    const styleOptions = {
      selected: [{
        geometry,
        stroke: makeStroke({ color: 'red', width: 1.5, lineDash: LINE_DASH_20_8_2_8 })
      }]
    }

    return makeStyle(styleOptions[mode] || [])
  }

  /**
   *
   */
  styles.filledStroke = geometry => {
    const styleOptions = [{
      geometry,
      stroke: makeStroke({ color: defaults.strokeColor, width: defaults.strokeWidth })
    },
    {
      geometry,
      stroke: makeStroke({ color: defaults.strokeFillColor, width: defaults.strokeFillWidth }),
      fill: makeFill({ color: defaults.fillColor })
    }]

    return makeStyle(styleOptions)
  }

  styles.makeStyle = options => {
    const styleOptions = []
    const props = { ...(registry[options.id] || {}), ...options }

    if (Props.lineHaloWidth(props)) {
      styleOptions.push({
        geometry: props.geometry,
        stroke: makeStroke({
          color: Props.lineHaloColor(props),
          lineDash: Props.lineDashArray(props),
          lineCap: Props.lineCap(props),
          width: Props.lineWidth(props) + Props.lineHaloWidth(props)
        })
      })
    }

    const fill = (() => {
      if (Props.fillColor(props)) {
        return makeFill({ color: Props.fillColor(props) })
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

        return makeFill({ color })
      }

      return null
    })()

    const image = (() => {
      if (Props.circleRadius(props)) {
        const fill = makeFill({ color: Props.circleFillColor(props) })
        const stroke = Props.circleLineColor(props)
          ? makeStroke({
            color: Props.circleLineColor(props),
            width: Props.circleLineWidth(props)
          })
          : null

        return makeCircle({
          fill,
          stroke,
          radius: Props.circleRadius(props)
        })
      } else if (Props.shapeRadius(props)) {
        const fillColor = Props.shapeFillColor(props)
        const fill = fillColor ? makeFill({ color: fillColor }) : null
        const stroke = makeStroke({ color: Props.shapeLineColor(props), width: Props.shapeLineWidth(props) })
        return makeRegularShape({
          fill: fill,
          stroke: stroke,
          radius: Props.shapeRadius(props),
          radius1: Props.shapeRadius1(props),
          radius2: Props.shapeRadius2(props),
          points: Props.shapePoints(props),
          angle: Props.shapeAngle(props),
          rotation: Props.shapeRotate(props),
          scale: Props.shapeScale(props),
          displacement: Props.shapeOffset(props)
        })
      } else if (Props.symbolSIDC(props)) {
        const size = 60 // TODO: make configurable
        const symbol = new ms.Symbol(Props.symbolSIDC(props), { size })
        const { width, height } = symbol.getSize()

        return makeIcon({
          anchor: [symbol.getAnchor().x, symbol.getAnchor().y],
          imgSize: [Math.floor(width), Math.floor(height)],
          img: symbol.asCanvas(),
          anchorXUnits: 'pixels',
          anchorYUnits: 'pixels',
          scale: 0.5
        })
      } else if (Props.iconUrl(props)) {
        return makeIcon({
          src: Props.iconUrl(props),
          scale: Props.iconScale(props) || 1,
          rotation: Props.iconRotate(props) || 0
        })
      } else return null
    })()

    const text = (() => {
      if (!Props.textField(props)) return null

      const rotation = Props.textRotate(props)
      const flipped = rotation ? rotation < -PI_OVER_2 || rotation > PI_OVER_2 : false
      const textAlign = Props.textJustify(props) || null
      const textOffset = Props.textOffset(props) || [0, 0]
      const offsetX = textOffset[0]
      const offsetY = textOffset[1]

      return makeText({
        text: Props.textField(props),
        font: Props.textFont(props),
        rotation: rotation ? flipped ? rotation + PI : rotation : null,
        textAlign: textAlign ? flipped ? TEXT_ALIGN[textAlign] : textAlign : null,
        offsetX: flipped ? -1 * offsetX : offsetX,
        offsetY: offsetY,
        padding: Props.textPadding(props) && new Array(4).fill(Props.textPadding(props)),
        fill: new Style.Fill({ color: Props.textColor(props) }),
        stroke: Props.textHaloColor(props) && new Style.Stroke({
          color: Props.textHaloColor(props),
          width: Props.textHaloWidth(props)
        }),
        backgroundFill: Props.textFillColor(props) && makeFill({ color: Props.textFillColor(props) }),
        backgroundStroke: Props.textLineColor(props) && makeStroke({
          color: Props.textLineColor(props),
          width: Props.textLineWidth(props)
        })
      })
    })()

    const stroke = (() => {
      if (!Props.lineWidth(props)) return null
      return makeStroke({
        color: Props.lineColor(props),
        lineCap: Props.lineCap(props),
        lineDash: Props.lineDashArray(props),
        width: Props.lineWidth(props)
      })
    })()

    styleOptions.push({
      geometry: props.geometry,
      fill,
      image,
      stroke,
      text
    })

    return makeStyle(styleOptions)
  }

  return styles
}
