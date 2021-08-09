import * as geom from 'ol/geom'
import Feature from 'ol/Feature'
import Geometry from 'ol/geom/Geometry'
import GeometryCollection from 'ol/geom/GeometryCollection'
import { Fill, Stroke, Circle, Style, Text, RegularShape } from 'ol/style'
import * as Colors from './color-schemes'
import * as MILSTD from '../../2525c'

export const stroke = options => new Stroke(options)
export const style = options => new Style(options)
export const text = options => new Text(options)
export const circle = options => new Circle(options)
export const fill = options => new Fill(options)
export const regularShape = options => new RegularShape(options)

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

const STROKE_WHITE_3 = new Stroke({ color: 'white', width: 3 })
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
    textStrokeColor: 'white'
  }

  const styles = {}

  styles.defaultStroke = geometry => ([
    style({
      geometry,
      stroke: stroke({ color: props.strokeColor, width: 3, lineDash: props.lineDash })
    }),
    style({
      geometry,
      stroke: stroke({ color: props.strokeFillColor, width: 2, lineDash: props.lineDash })
    })
  ])

  styles.filledStroke = geometry => ([
    style({
      geometry,
      stroke: stroke({ color: props.strokeColor, width: 3 })
    }),
    style({
      geometry,
      stroke: stroke({ color: props.strokeFillColor, width: 2 }),
      fill: fill({ color: props.fillColor })
    })
  ])

  styles.dashedStroke = geometry => ([
    style({
      geometry,
      stroke: stroke({ color: props.strokeColor, width: 3, lineDash: [8, 8] })
    }),
    style({
      geometry,
      stroke: stroke({ color: props.strokeFillColor, width: 2, lineDash: [8, 8] })
    })
  ])

  styles.solidStroke = geometry => ([
    style({
      geometry,
      stroke: stroke({ color: props.strokeColor, width: 3 })
    }),
    style({
      geometry,
      stroke: stroke({ color: props.strokeFillColor, width: 2 })
    })
  ])

  styles.text = (geometry, options) => {
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

  styles.outlinedText = (geometry, options) => {
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
