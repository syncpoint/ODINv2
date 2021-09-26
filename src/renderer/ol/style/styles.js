import * as geom from 'ol/geom'
import * as Style from 'ol/style'
import ms from 'milsymbol'
import * as Colors from './color-schemes'
import { identityCode, statusCode } from '../../symbology/2525c'
import * as pattern from './styles-pattern'
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
  angle: PI_OVER_4
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

  const defaults = {
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

  styles.font = options => {
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
    console.log('labels', labelOptions)
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
    const fill = options.fillPattern && pattern.fill({
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

  return styles
}
