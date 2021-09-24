import * as geom from 'ol/geom'
import Feature from 'ol/Feature'
import Geometry from 'ol/geom/Geometry'
import GeometryCollection from 'ol/geom/GeometryCollection'
import * as Style from 'ol/style'
import ms from 'milsymbol'
import * as Colors from './color-schemes'
import { identityCode, statusCode } from '../../symbology/2525c'
import * as pattern from './styles-pattern'


/**
 *
 */
const STYLE = {
  stroke: options => new Style.Stroke(options),
  style: options => new Style.Style(options),
  text: options => new Style.Text(options),
  circle: options => new Style.Circle(options),
  fill: options => new Style.Fill(options),
  regularShape: options => new Style.RegularShape(options),
  icon: options => new Style.Icon(options)
}


// TODO: move up one level (ol/)
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
const FILL_WHITE_40 = STYLE.fill({ color: COLOR_WHITE_40 })
const STROKE_CAROLINA_BLUE = STYLE.stroke({ color: COLOR_CAROLINA_BLUE, width: 1.25 })
const LINE_DASH_DEFAULT = [20, 10]

const STYLE_OL = STYLE.style({
  image: STYLE.circle({
    fill: FILL_WHITE_40,
    stroke: STROKE_CAROLINA_BLUE,
    radius: 5
  }),
  fill: FILL_WHITE_40,
  stroke: STROKE_CAROLINA_BLUE
})

export const styles = {}

styles.DEFAULT = () => STYLE_OL

// TODO: think about general stroke cache

const STROKE_WHITE_3 = STYLE.stroke({ color: 'white', width: 3 })
const MULTI_SELECT_HANDLE = STYLE.regularShape({
  fill: STYLE.fill({ color: 'white' }),
  stroke: STYLE.stroke({ color: 'black', width: 1 }),
  radius: 6,
  points: 4,
  angle: Math.PI / 4
})


/**
 *
 */
const text = (geometry, options = {}) => {

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

  const font = options.font || `${options.fontWeight} ${options.fontSize} ${options.fontFamily}`

  // Text stroke is optional:
  const textStroke = options.textStrokeWidth
    ? STYLE.stroke({ width: options.textStrokeWidth, color: options.textStrokeColor })
    : null

  return STYLE.style({
    geometry,
    text: STYLE.text({
      ...options,
      font,
      stroke: textStroke,
      fill: STYLE.fill({ color: options.textFillColor }),
      textAlign,
      rotation,
      offsetX,
      overflow: true
    })
  })
}


const symbol = (geometry, sidc, options) => {
  const symbol = new ms.Symbol(sidc, { ...options })
  const { width, height } = symbol.getSize()

  const image = STYLE.icon({
    anchor: [symbol.getAnchor().x, symbol.getAnchor().y],
    imgSize: [Math.floor(width), Math.floor(height)],
    img: symbol.asCanvas(),
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    scale: 0.5
  })

  return STYLE.style({ geometry, image })
}

export const makeStyles = (sidcLike, mode = 'default') => {
  if (!sidcLike) return null
  if (sidcLike instanceof Feature) return makeStyles(sidcLike.get('sidc'), mode)
  if (!(typeof sidcLike === 'string')) return null

  const sidc = sidcLike
  const standardIdentity = identityCode(sidc)
  const status = statusCode(sidc)

  const props = {
    strokeColor: Colors.stroke(standardIdentity),
    strokeFillColor: Colors.fill(SCHEME_DEFAULT)(standardIdentity),
    lineDash: status === 'A' ? LINE_DASH_DEFAULT : null,
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

  styles.defaultStroke = (geometry, options = {}) => {
    const fill = options.fillPattern && pattern.fill({ ...props, ...options.fillPattern })

    return [
      STYLE.style({
        geometry,
        stroke: STYLE.stroke({
          color: props.strokeColor,
          width: props.strokeWidth,
          lineDash: props.lineDash
        })
      }),
      STYLE.style({
        geometry,
        stroke: STYLE.stroke({
          color: props.strokeFillColor,
          width: props.strokeFillWidth,
          lineDash: props.lineDash
        }),
        fill: fill && STYLE.fill({ color: fill })
      })
    ]
  }

  styles.filledStroke = geometry => ([
    STYLE.style({
      geometry,
      stroke: STYLE.stroke({ color: props.strokeColor, width: props.strokeWidth })
    }),
    STYLE.style({
      geometry,
      stroke: STYLE.stroke({ color: props.strokeFillColor, width: props.strokeFillWidth }),
      fill: STYLE.fill({ color: props.fillColor })
    })
  ])

  styles.dashedStroke = (geometry, options = {}) => {
    const lineDash = options.lineDash || [8, 8]

    return [
      STYLE.style({
        geometry,
        stroke: STYLE.stroke({ color: props.strokeColor, width: props.strokeWidth, lineDash })
      }),
      STYLE.style({
        geometry,
        stroke: STYLE.stroke({ color: props.strokeFillColor, width: props.strokeFillWidth, lineDash })
      })
    ]
  }

  styles.solidStroke = geometry => ([
    STYLE.style({
      geometry,
      stroke: STYLE.stroke({ color: props.strokeColor, width: props.strokeWidth })
    }),
    STYLE.style({
      geometry,
      stroke: STYLE.stroke({ color: props.strokeFillColor, width: props.strokeFillWidth })
    })
  ])

  styles.waspStroke = geometry => ([
    STYLE.style({
      geometry,
      stroke: STYLE.stroke({ color: 'black', width: props.strokeWidth })
    }),
    STYLE.style({
      geometry,
      stroke: STYLE.stroke({ color: 'yellow', width: props.strokeFillWidth, lineDash: [10, 10] })
    })
  ])

  styles.guideStroke = geometry => mode === 'selected'
    ? [
        STYLE.style({
          geometry,
          stroke: STYLE.stroke({ color: 'red', width: 1.5, lineDash: [20, 8, 2, 8] })
        })
      ]
    : []


  /**
   *
   */
  styles.label = (geometry, options = {}) => {
    // TODO: symbol
    // TODO: echelon
    // TODO: text

    if (options.symbol) {
      return styles.symbol(geometry, { sidc: options.symbol, infoFields: false })
    } else {
      return styles.text(geometry, options)
    }
  }

  styles.text = (geometry, options = {}) => {
    return text(geometry, {
      ...options,
      fontWeight: options.fontWeight || props.fontWeight,
      fontSize: options.fontSize || props.fontSize,
      fontFamily: options.fontFamily || props.fontFamily,
      textFillColor: options.textFillColor || props.textFillColor,
      textStrokeColor: options.textStrokeColor || props.textStrokeColor
    })
  }

  styles.outlinedText = (geometry, options = {}) => {
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

    const fontWeight = options.fontWeight || props.fontWeight
    const fontSize = options.fontSize || props.fontSize
    const fontFamily = options.fontFamily || props.fontFamily
    const font = options.font || `${fontWeight} ${fontSize} ${fontFamily}`
    const textStrokeWidth = options.textStrokeWidth || props.textStrokeWidth
    const textStrokeColor = options.textStrokeColor || props.textStrokeColor
    const textFillColor = options.textFillColor || props.textFillColor

    return STYLE.style({
      geometry,
      text: STYLE.text({
        ...options,
        font,
        stroke: STYLE.stroke({ width: textStrokeWidth, color: textStrokeColor }),
        fill: STYLE.fill({ color: textFillColor }),
        textAlign,
        rotation,
        offsetX,
        overflow: true
      })
    })
  }

  styles.symbol = (geometry, options) => {
    const size = 60 // TODO: make configurable
    return symbol(geometry, sidc, { ...options, size })
  }

  styles.handles = (geometry, options = {}) => {
    return mode === 'selected'
      ? [STYLE.style({
          geometry,
          image: STYLE.circle({
            fill: STYLE.fill({ color: options.color || 'rgba(255,0,0,0.6)' }),
            stroke: STROKE_WHITE_3,
            radius: 7
          })
        })]
      : mode === 'multiple'
        ? [STYLE.style({
            geometry: new geom.Point(geometry.getFirstCoordinate()),
            image: MULTI_SELECT_HANDLE
          })]
        : []
  }

  return styles
}
