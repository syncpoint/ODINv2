import * as olStyle from 'ol/style'
import { PI_OVER_2, PI_OVER_4, PI } from '../../../shared/Math'
import ms from 'milsymbol'

const TEXT_ALIGN = {
  start: 'end',
  end: 'start',
  left: 'right',
  right: 'left',
  center: 'center'
}

const makeStroke = props => {
  if (!props['line-width']) return null
  return new olStyle.Stroke({
    color: props['line-color'],
    lineCap: props['line-cap'],
    lineJoin: props['line-join'],
    lineDash: props['line-dash-array'],
    width: props['line-width']
  })
}

const makeText = props => {
  if (!props['text-field']) return null

  const rotate = props['text-rotate']
  const flipped = rotate ? rotate < -PI_OVER_2 || rotate > PI_OVER_2 : false
  const textAlign = props['text-justify'] || null
  const textOffset = props['text-offset'] || [0, 0]
  const offsetX = textOffset[0]
  const offsetY = textOffset[1]

  return new olStyle.Text({
    font: props['text-font'],
    text: props['text-field'],
    rotation: rotate ? flipped ? rotate + PI : rotate : null,
    textAlign: textAlign ? flipped ? TEXT_ALIGN[textAlign] : textAlign : null,
    offsetX: flipped ? -1 * offsetX : offsetX,
    offsetY,
    padding: props['text-padding'] && new Array(4).fill(props['text-padding']),
    fill: new olStyle.Fill({ color: props['text-color'] }),
    stroke: props['text-halo-color'] && new olStyle.Stroke({
      color: props['text-halo-color'],
      width: props['text-halo-width']
    }),
    backgroundFill: props['text-fill-color'] && new olStyle.Fill({ color: props['text-fill-color'] }),
    backgroundStroke: props['text-line-color'] && new olStyle.Stroke({
      color: props['text-line-color'],
      width: props['text-line-width']
    })
  })
}

const makeCircle = props => {
  const fill = new olStyle.Fill({ color: props['circle-fill-color'] })
  const stroke = props['circle-line-color']
    ? new olStyle.Stroke({
      color: props['circle-line-color'],
      width: props['circle-line-width']
    })
    : null

  return new olStyle.Circle({
    fill,
    stroke,
    radius: props['circle-radius']
  })
}

const makeShape = props => {
  const fillColor = props['shape-fill-color']
  const fill = fillColor ? new olStyle.Fill({ color: fillColor }) : null
  const stroke = new olStyle.Stroke({
    color: props['shape-line-color'],
    width: props['shape-line-width']
  })

  return new olStyle.RegularShape({
    fill,
    stroke,
    radius: props['shape-radius'],
    radius1: props['shape-radius-1'],
    radius2: props['shape-radius-2'],
    points: props['shape-points'],
    angle: props['shape-angle'],
    rotation: props['shape-rotate'],
    scale: props['shape-scale'],
    displacement: props['shape-offset']
  })
}

const makeSymbol = props => {
  const modes = { dark: 'Dark', medium: 'Medium', light: 'Light' }

  const options = {
    colorMode: modes[props['color-scheme']],
    outlineColor: props['symbol-halo-color'],
    outlineWidth: props['symbol-halo-width'],
    monoColor: props['symbol-color'],
    infoSize: props['symbol-text-size'],
    infoColor: props['symbol-text-color'],
    strokeWidth: props['symbol-line-width'],
    fillOpacity: props['symbol-fill-opacity'],
    size: props['symbol-size'] || 60,
    ...props['symbol-modifiers']
  }

  const symbol = new ms.Symbol(props['symbol-code'], { ...options })
  const { width, height } = symbol.getSize()

  return new olStyle.Icon({
    anchor: [symbol.getAnchor().x, symbol.getAnchor().y],
    imgSize: [Math.floor(width), Math.floor(height)],
    src: 'data:image/svg+xml;utf8,' + symbol.asSVG(),
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    scale: props['icon-scale'] || 0.5
  })
}

const makeIcon = props => {
  return new olStyle.Icon({
    src: props['icon-url'],
    scale: props['icon-scale'] || 1,
    rotation: props['icon-rotate'] || 0
  })
}

const makeImage = props => {
  if (props['circle-radius']) return makeCircle(props)
  else if (props['shape-radius']) return makeShape(props)
  else if (props['symbol-code']) return makeSymbol(props)
  else if (props['icon-url']) return makeIcon(props)
  else return null
}

/**
 *
 */
export const styleFactory = effectiveStyle => {
  const font = effectiveStyle['text-font'] || [
    effectiveStyle['text-font-style'],
    effectiveStyle['text-font-variant'],
    effectiveStyle['text-font-weight'],
    effectiveStyle['text-font-size'],
    effectiveStyle['text-font-family']
  ].filter(Boolean).join(' ')

  const registry = {}

  registry['style:2525c/symbol'] = {
    'color-scheme': effectiveStyle['color-scheme'],
    'symbol-color': effectiveStyle['symbol-color'],
    'symbol-halo-color': effectiveStyle['symbol-halo-color'],
    'symbol-halo-width': effectiveStyle['symbol-halo-width'],
    'symbol-text-color': effectiveStyle['symbol-text-color'],
    'symbol-text-size': effectiveStyle['symbol-text-size'],
    'symbol-text': effectiveStyle['symbol-text'],
    'symbol-fill': effectiveStyle['symbol-fill'],
    'symbol-fill-opacity': effectiveStyle['symbol-fill-opacity'],
    'symbol-frame': effectiveStyle['symbol-frame'],
    'symbol-icon': effectiveStyle['symbol-icon'],
    'symbol-line-width': effectiveStyle['symbol-line-width'],
    'symbol-size': effectiveStyle['symbol-size'],
    'icon-scale': effectiveStyle['icon-scale']
  }

  registry['style:2525c/default-stroke'] = {
    'line-cap': effectiveStyle['line-cap'],
    'line-join': effectiveStyle['line-join'],
    'line-color': effectiveStyle['line-color'],
    'line-width': effectiveStyle['line-width'],
    'line-dash-array': effectiveStyle['line-dash-array'],
    'line-halo-color': effectiveStyle['line-halo-color'],
    'line-halo-width': effectiveStyle['line-halo-width'],
    'line-halo-dash-array': effectiveStyle['line-halo-dash-array']

  }

  registry['style:2525c/solid-stroke'] = {
    'line-cap': effectiveStyle['line-cap'],
    'line-join': effectiveStyle['line-join'],
    'line-color': effectiveStyle['line-color'],
    'line-width': effectiveStyle['line-width'],
    'line-halo-color': effectiveStyle['line-halo-color'],
    'line-halo-width': effectiveStyle['line-halo-width']
  }

  registry['style:2525c/dashed-stroke'] = {
    'line-cap': effectiveStyle['line-cap'],
    'line-join': effectiveStyle['line-join'],
    'line-color': effectiveStyle['line-color'],
    'line-width': effectiveStyle['line-width'],
    'line-dash-array': [8, 8],
    'line-halo-color': effectiveStyle['line-halo-color'],
    'line-halo-width': effectiveStyle['line-halo-width'],
    'line-halo-dash-array': [8, 8]
  }

  registry['style:2525c/solid-fill'] = {
    'line-cap': effectiveStyle['line-cap'],
    'line-join': effectiveStyle['line-join'],
    'line-color': effectiveStyle['line-color'],
    'line-width': effectiveStyle['line-width'],
    'line-halo-color': effectiveStyle['line-halo-color'],
    'line-halo-width': effectiveStyle['line-halo-width'],
    'fill-color': effectiveStyle['fill-color']
  }

  registry['style:default-text'] = {
    'text-font': font,
    'text-color': effectiveStyle['text-color'],
    'text-justify': 'center',
    'text-padding': 5
  }

  registry['style:2525c/fence-stroke'] = {
    'line-cap': 'square',
    'line-color': effectiveStyle['binary-color'],
    'line-width': 2
  }

  registry['style:2525c/fence-o'] = {
    'shape-line-color': effectiveStyle['binary-color'],
    'shape-line-width': 2,
    'shape-points': 8,
    'shape-radius': 8,
    'shape-radius-2': 8,
    'shape-angle': PI_OVER_4,
    'shape-scale': [0.8, 1.4]
  }

  registry['style:2525c/fence-x'] = {
    'shape-line-color': effectiveStyle['binary-color'],
    'shape-line-width': 2,
    'shape-points': 4,
    'shape-radius': 8,
    'shape-radius-2': 0,
    'shape-angle': PI_OVER_4,
    'shape-scale': [1, 1.4]
  }

  const makeFill = props => {
    if (props['fill-color']) {
      return new olStyle.Fill({ color: props['fill-color'] })
    } else if (props['fill-pattern']) {
      // const color = patterns.fill({
      //   pattern: Props.fillPattern(props),
      //   angle: Props.fillPatternAngle(props),
      //   size: Props.fillPatternSize(props),
      //   spacing: Props.fillPatternSpacing(props),
      //   strokeColor: Props.lineHaloColor(props),
      //   strokeWidth: Props.lineHaloWidth(props) + Props.lineWidth(props),
      //   strokeFillColor: Props.lineColor(props),
      //   strokeFillWidth: Props.lineWidth(props)
      // })

      // return new style.Fill({ color })
    } else return null
  }


  const makeStyle = options => Array.isArray(options)
    ? options.map(makeStyle)
    : new olStyle.Style(options)

  return options => {
    const styleOptions = []
    const props = { ...(registry[options.id] || {}), ...options }

    if (props['line-halo-width']) {
      styleOptions.push({
        geometry: props.geometry,
        stroke: makeStroke({
          'line-color': props['line-halo-color'],
          'line-dash-array': props['line-dash-array'],
          'line-width': props['line-width'] + props['line-halo-width'],
          'line-cap': props['line-cap'],
          'line-join': props['line-join']
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
