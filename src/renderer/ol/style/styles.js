import { DEVICE_PIXEL_RATIO } from 'ol/has'
import * as geom from 'ol/geom'
import Feature from 'ol/Feature'
import Geometry from 'ol/geom/Geometry'
import GeometryCollection from 'ol/geom/GeometryCollection'
import * as Style from 'ol/style'
import ms from 'milsymbol'
import * as Colors from './color-schemes'
import * as MILSTD from '../../2525c'

export const stroke = options => new Style.Stroke(options)
export const style = options => new Style.Style(options)
export const text = options => new Style.Text(options)
export const circle = options => new Style.Circle(options)
export const fill = options => new Style.Fill(options)
export const regularShape = options => new Style.RegularShape(options)
export const icon = options => new Style.Icon(options)


const patterns = {
  hatch: {
    width: 5,
    height: 5,
    lines: [[0, 2.5, 5, 2.5]]
  },
  cross: {
    width: 7,
    height: 7,
    lines: [[0, 3, 10, 3], [3, 0, 3, 10]]
  }
}

const patternDescriptor = options => {
  const d = Math.round(options.spacing) || 10
  const pattern = patterns[options.pattern]

  let a = Math.round(((options.angle || 0) - 90) % 360)
  if (a > 180) a -= 360
  a *= Math.PI / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  if (Math.abs(sin) < 0.0001) {
    pattern.width = pattern.height = d
    pattern.lines = [[0, 0.5, d, 0.5]]
    pattern.repeat = [[0, 0], [0, d]]
  } else if (Math.abs(cos) < 0.0001) {
    pattern.width = pattern.height = d
    pattern.lines = [[0.5, 0, 0.5, d]]
    pattern.repeat = [[0, 0], [d, 0]]
    if (options.pattern === 'cross') {
      pattern.lines.push([0, 0.5, d, 0.5])
      pattern.repeat.push([0, d])
    }
  } else {
    const w = pattern.width = Math.round(Math.abs(d / sin)) || 1
    const h = pattern.height = Math.round(Math.abs(d / cos)) || 1
    if (options.pattern === 'cross') {
      pattern.lines = [[-w, -h, 2 * w, 2 * h], [2 * w, -h, -w, 2 * h]]
      pattern.repeat = [[0, 0]]
    } else if (cos * sin > 0) {
      pattern.lines = [[-w, -h, 2 * w, 2 * h]]
      pattern.repeat = [[0, 0], [w, 0], [0, h]]
    } else {
      pattern.lines = [[2 * w, -h, -w, 2 * h]]
      pattern.repeat = [[0, 0], [-w, 0], [0, h]]
    }
  }
  pattern.stroke = options.size === 0 ? 0 : options.size || 4
  return pattern
}

const fillPattern = options => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const descriptor = patternDescriptor(options)

  canvas.width = Math.round(descriptor.width * DEVICE_PIXEL_RATIO)
  canvas.height = Math.round(descriptor.height * DEVICE_PIXEL_RATIO)
  context.scale(DEVICE_PIXEL_RATIO, DEVICE_PIXEL_RATIO)
  context.lineCap = 'round'

  ;[
    [options.strokeColor, options.strokeWidth],
    [options.strokeFillColor, options.strokeFillWidth]
  ].forEach(([strokeStyle, lineWidth]) => {
    context.lineWidth = lineWidth
    context.strokeStyle = strokeStyle
    const repeat = descriptor.repeat || [[0, 0]]

    if (descriptor.lines) {
      for (let i = 0; i < descriptor.lines.length; i++) {
        for (let r = 0; r < repeat.length; r++) {
          const line = descriptor.lines[i]
          context.beginPath()
          context.moveTo(line[0] + repeat[r][0], line[1] + repeat[r][1])
          for (let k = 2; k < line.length; k += 2) {
            context.lineTo(line[k] + repeat[r][0], line[k + 1] + repeat[r][1])
          }
          context.stroke()
        }
      }
    }
  })

  return context.createPattern(canvas, 'repeat')
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

export const styles = {}

styles.DEFAULT = () => STYLE_OL

// TODO: think about general stroke cache

const STROKE_WHITE_3 = stroke({ color: 'white', width: 3 })
const MULTI_SELECT_HANDLE = regularShape({
  fill: fill({ color: 'white' }),
  stroke: stroke({ color: 'black', width: 1 }),
  radius: 6,
  points: 4,
  angle: Math.PI / 4
})

export const makeStyles = (sidcLike, mode = 'default') => {
  if (!sidcLike) return null
  if (sidcLike instanceof Feature) return makeStyles(sidcLike.get('sidc'), mode)
  if (!(typeof sidcLike === 'string')) return null

  const sidc = sidcLike
  const standardIdentity = MILSTD.standardIdentity(sidc)
  const status = MILSTD.status(sidc)

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
    const pattern = options.fillPattern && fillPattern({ ...props, ...options.fillPattern })

    return [
      style({
        geometry,
        stroke: stroke({
          color: props.strokeColor,
          width: props.strokeWidth,
          lineDash: props.lineDash
        })
      }),
      style({
        geometry,
        stroke: stroke({
          color: props.strokeFillColor,
          width: props.strokeFillWidth,
          lineDash: props.lineDash
        }),
        fill: pattern && fill({ color: pattern })
      })
    ]
  }

  styles.filledStroke = geometry => ([
    style({
      geometry,
      stroke: stroke({ color: props.strokeColor, width: props.strokeWidth })
    }),
    style({
      geometry,
      stroke: stroke({ color: props.strokeFillColor, width: props.strokeFillWidth }),
      fill: fill({ color: props.fillColor })
    })
  ])

  styles.dashedStroke = geometry => ([
    style({
      geometry,
      stroke: stroke({ color: props.strokeColor, width: props.strokeWidth, lineDash: [8, 8] })
    }),
    style({
      geometry,
      stroke: stroke({ color: props.strokeFillColor, width: props.strokeFillWidth, lineDash: [8, 8] })
    })
  ])

  styles.solidStroke = geometry => ([
    style({
      geometry,
      stroke: stroke({ color: props.strokeColor, width: props.strokeWidth })
    }),
    style({
      geometry,
      stroke: stroke({ color: props.strokeFillColor, width: props.strokeFillWidth })
    })
  ])

  styles.waspStroke = geometry => ([
    style({
      geometry,
      stroke: stroke({ color: 'black', width: props.strokeWidth })
    }),
    style({
      geometry,
      stroke: stroke({ color: 'yellow', width: props.strokeFillWidth, lineDash: [10, 10] })
    })
  ])

  styles.guideStroke = geometry => mode === 'selected'
    ? [
        style({
          geometry,
          stroke: stroke({ color: 'red', width: 1.5, lineDash: [20, 8, 2, 8] })
        })
      ]
    : []


  styles.text = (geometry, options = {}) => {

    if (options.symbol) {
      return styles.symbol(geometry, {
        symbol: {
          sidc: options.symbol,
          size: 60,
          infoFields: true,
          infoColor: 'black',
          outlineWidth: 4,
          outlineColor: 'white'
        },
        icon: { scale: 0.5 }
      })
    }

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
    const textFillColor = options.textFillColor || props.textFillColor
    const textStrokeColor = options.textStrokeColor || props.textStrokeColor

    // Text stroke is optional:
    const textStroke = options.textStrokeWidth
      ? stroke({ width: options.textStrokeWidth, color: textStrokeColor })
      : null

    return style({
      geometry,
      text: text({
        ...options,
        font,
        stroke: textStroke,
        fill: fill({ color: textFillColor }),
        textAlign,
        rotation,
        offsetX,
        overflow: true
      })
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

    return style({
      geometry,
      text: text({
        ...options,
        font,
        stroke: stroke({ width: textStrokeWidth, color: textStrokeColor }),
        fill: fill({ color: textFillColor }),
        textAlign,
        rotation,
        offsetX,
        overflow: true
      })
    })
  }

  styles.symbol = (geometry, options) => {
    const symbol = new ms.Symbol(sidc, options.symbol)
    const size = symbol.getSize()
    const image = icon({
      anchor: [symbol.getAnchor().x, symbol.getAnchor().y],
      imgSize: [Math.floor(size.width), Math.floor(size.height)],
      img: symbol.asCanvas(),
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      ...options.icon
    })

    return style({ geometry, image })
  }

  styles.handles = (geometry, options = {}) => {
    return mode === 'selected'
      ? [style({
          geometry,
          image: circle({
            fill: fill({ color: options.color || 'rgba(255,0,0,0.6)' }),
            stroke: STROKE_WHITE_3,
            radius: 7
          })
        })]
      : mode === 'multiple'
        ? [style({
            geometry: new geom.Point(geometry.getFirstCoordinate()),
            image: MULTI_SELECT_HANDLE
          })]
        : []
  }

  return styles
}
