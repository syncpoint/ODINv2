import * as geom from 'ol/geom'
import * as Style from 'ol/style'
import ms from 'milsymbol'
import * as Colors from './color-schemes'
import { identityCode, statusCode } from '../../symbology/2525c'
import * as pattern from './styles-pattern'

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
const COLOR_CAROLINA_BLUE = '#C' // https://coolors.co/3399cc
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
  angle: Math.PI / 4
})

const HANDLE_SINGLE_SELECT = makeCircle({
  fill: FILL_RED_60,
  stroke: STROKE_WHITE_3,
  radius: 7
})


/**
 *
 */
export const makeStyles = (feature, mode = 'default') => {
  const sidc = feature.get('sidc')
  const standardIdentity = identityCode(sidc)
  const status = statusCode(sidc)

  const props = {
    strokeColor: Colors.stroke(standardIdentity),
    strokeFillColor: Colors.fill(SCHEME_DEFAULT)(standardIdentity),
    lineDash: status === 'A' ? LINE_DASH_20_10 : null,
    fillColor: Colors.fill(SCHEME_DEFAULT)(standardIdentity),
    fontWeight: 'normal',
    fontSize: '12px',
    fontFamily: 'sans-serif',
    textFillColor: '#333',
    textStrokeWidth: 3,
    textStrokeColor: 'white',
    strokeWidth: 3,
    strokeFillWidth: 2
  }

  const styles = {}


  const PI = Math.PI
  const TWO_PI = 2 * Math.PI
  const HALF_PI = Math.PI / 2
  const TEXT_ALIGN = {
    start: 'end',
    end: 'start',
    left: 'right',
    right: 'left',
    center: 'center'
  }

  const textOptions = options => {
    const fontWeight = options.fontWeight || props.fontWeight
    const fontSize = options.fontSize || props.fontSize
    const fontFamily = options.fontFamily || props.fontFamily
    const font = options.font || `${fontWeight} ${fontSize} ${fontFamily}`
    const { text, angle, textAlign, offsetX, offsetY } = options
    const flipped = angle ? angle < -HALF_PI || angle > HALF_PI : false

    return {
      text,
      font,
      overflow: true,

      // Adjust some options depending on rotation angle:
      rotation: angle ? flipped ? PI - angle : TWO_PI - angle : null,
      textAlign: textAlign ? flipped ? TEXT_ALIGN[textAlign] : textAlign : null,
      offsetX: offsetX ? flipped ? -1 * offsetX : offsetX : 0,
      offsetY: offsetY || 0
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

  styles.text = (geometry, options = {}) => {
    const text = makeText(textOptions(options))
    return [makeStyle({ geometry, text })]
  }

  styles.outlinedText = (geometry, options = {}) => {
    const textStrokeWidth = options.textStrokeWidth || props.textStrokeWidth
    const textStrokeColor = options.textStrokeColor || props.textStrokeColor
    const textFillColor = options.textFillColor || props.textFillColor

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
    const fill = options.fillPattern && pattern.fill({
      ...props, ...options.fillPattern
    })

    const styleOptions = [
      {
        geometry,
        stroke: makeStroke({
          color: props.strokeColor,
          width: props.strokeWidth,
          lineDash: props.lineDash
        })
      },
      {
        geometry,
        stroke: makeStroke({
          color: props.strokeFillColor,
          width: props.strokeFillWidth,
          lineDash: props.lineDash
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
      { color: props.strokeColor, width: props.strokeWidth },
      { color: props.strokeFillColor, width: props.strokeFillWidth }
    ]

    return strokeStyle(geometry, strokeOptions)
  }

  /**
   *
   */
  styles.dashedStroke = (geometry, options = {}) => {
    const lineDash = options.lineDash || LINE_DASH_8_8
    const strokeOptions = [
      { color: props.strokeColor, width: props.strokeWidth, lineDash },
      { color: props.strokeFillColor, width: props.strokeFillWidth, lineDash }
    ]

    return strokeStyle(geometry, strokeOptions)
  }

  /**
   *
   */
  styles.waspStroke = geometry => {
    const strokeOptions = [
      { color: 'black', width: props.strokeWidth },
      { color: 'yellow', width: props.strokeFillWidth, lineDash: LINE_DASH_10_10 }
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
      stroke: makeStroke({ color: props.strokeColor, width: props.strokeWidth })
    },
    {
      geometry,
      stroke: makeStroke({ color: props.strokeFillColor, width: props.strokeFillWidth }),
      fill: makeFill({ color: props.fillColor })
    }]

    return makeStyle(styleOptions)
  }

  return styles
}
