/* eslint-disable camelcase */
import * as R from 'ramda'
import { Stroke, Style, Fill, Text, Icon } from 'ol/style'
import { Jexl } from 'jexl'
import ms from 'milsymbol'
import { rules } from './rules'
import * as Colors from '../../ol/style/color-schemes'
import { identityCode, parameterized } from '../../symbology/2525c'
import { smooth } from '../../ol/style/chaikin'
import { transform } from '../../model/geometry'

const jexl = new Jexl()


/**
 *
 */
const styleFactory = effective => {
  const modes = { dark: 'Dark', medium: 'Medium', light: 'Light' }
  const colorScheme = effective['color-scheme']
  const lineHaloColor = effective['line-halo-color']
  const lineColor = effective['line-color']
  const textColor = effective['text-color']
  const textHaloColor = effective['text-halo-color']
  const textHaloWidth = effective['text-halo-width']
  const symbolColor = effective['symbol-color']
  const symbolHaloColor = effective['symbol-halo-color']
  const symbolHaloWidth = effective['symbol-halo-width']
  const symbolTextColor = effective['symbol-text-color']
  const symbolTextSize = effective['symbol-text-size']
  const symbolText = effective['symbol-text']
  const symbolFill = effective['symbol-fill']
  const symbolFillOpacity = effective['symbol-fill-opacity']
  const symbolFrame = effective['symbol-frame']
  const symbolIcon = effective['symbol-icon']
  const symbolLineWidth = effective['symbol-line-width']
  const symbolSize = effective['symbol-size']
  const iconScale = effective['icon-scale']

  const font = effective['text-font'] || [
    effective['text-font-style'],
    effective['text-font-variant'],
    effective['text-font-weight'],
    effective['text-font-size'],
    effective['text-font-family']
  ].filter(Boolean).join(' ')

  const textFill = textColor ? new Fill({ color: textColor }) : undefined
  const textStroke = textHaloColor && textHaloWidth
    ? new Stroke({ color: textHaloColor, width: textHaloWidth })
    : undefined

  const stroke = (options = {}) => [
    new Stroke({ color: lineHaloColor, width: 4, ...options }),
    new Stroke({ color: lineColor, width: 3, ...options })
  ]

  const text = (options = {}) =>
    new Text({ font, stroke: textStroke, fill: textFill, ...options })

  const symbol = (sidc, options = {}) => {
    const symbol = new ms.Symbol(sidc, {
      colorMode: modes[colorScheme],
      monoColor: symbolColor,
      fill: symbolFill,
      fillOpacity: R.isNil(symbolFillOpacity) ? 1 : symbolFillOpacity,
      frame: symbolFrame,
      icon: symbolIcon,
      infoFields: symbolText,
      outlineColor: symbolHaloColor,
      outlineWidth: symbolHaloWidth,
      strokeWidth: R.isNil(symbolLineWidth) ? 3 : symbolLineWidth,
      infoColor: symbolTextColor,
      infoSize: symbolTextSize,
      size: symbolSize || 100,
      ...options
    })

    const { width, height } = symbol.getSize()

    return new Icon({
      anchor: [symbol.getAnchor().x, symbol.getAnchor().y],
      imgSize: [Math.floor(width), Math.floor(height)],
      src: 'data:image/svg+xml;utf8,' + symbol.asSVG(),
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      scale: iconScale || 0.3
    })
  }

  const style = options => new Style(options)
  return { stroke, text, symbol, style }
}

rules.shared = []
rules.generic = [] // LineString, Polygon

/**
 * sidc, sidc_parameterized, sidc+identity
 */
rules.shared.push([next => {
  const { sidc } = next.properties
  const sidc_parameterized = parameterized(sidc)

  return {
    sidc,
    sidc_parameterized,
    identity: identityCode(sidc)
  }
}, ['properties']])


/**
 * line_smooth, style_factory
 */
rules.shared.push([next => {
  const global = next.style_default || {}
  const layer = next.style_layer || {}
  const feature = next.style_feature || {}
  const identity = next.identity

  const colorScheme = feature?.['color-scheme'] ||
    layer?.['color-scheme'] ||
    global?.['color-scheme'] ||
    'medium'

  const scheme = {
    'line-color': Colors.lineColor(colorScheme)(identity),
    'line-halo-color': Colors.lineHaloColor(identity)
  }

  // Split line-smooth from rest.
  // We don't want to calculate new geometries on color change.
  const merged = { ...global, ...layer, ...scheme, ...feature }
  const { 'line-smooth': line_smooth, ...effective } = merged
  const style_factory = styleFactory(effective)
  return { line_smooth: !!line_smooth, style_factory }
}, ['identity', 'style_default', 'style_layer', 'style_feature']])


/**
 * labels_resolved
 */
rules.generic.push([next => {
  const labels = next.labels
  const properties = next.properties
  const evalSync = textField => Array.isArray(textField)
    ? textField.map(evalSync).filter(Boolean).join('\n')
    : jexl.evalSync(textField, properties)

  const textField = label => evalSync(label['text-field'])
  const [text, others] = R.partition(R.prop('text-field'), labels.flat())
  const textLabels = text
    .map(label => ({ ...label, 'text-field': textField(label) }))
    .filter(R.prop('text-field'))

  return { labels_resolved: [...others, ...textLabels] }
}, ['labels']])


/**
 *
 */
rules.generic.push([next => {
  const { text, style } = next.style_factory
  const labels = next.labels_resolved
  const text_styles = labels
    .map(next.label_options)
    .map(({ geometry, options }) => style({ geometry, text: text(options) }))

  return { text_styles }
}, ['labels_resolved', 'label_options', 'style_factory']])


/**
 * simplified, geometry_smoothened
 */
rules.generic.push([next => {
  const geometry_simplified = next.geometry_simplified
  const geometry_smoothened = next.line_smooth
    ? smooth(geometry_simplified)
    : geometry_simplified

  return { geometry_smoothened }
}, ['line_smooth', 'geometry_key', 'geometry_simplified']])


/**
 * read, write, resolution_point, geometry_utm
 */
rules.generic.push([next => {
  const geometry_smoothened = next.geometry_smoothened
  const { read, write, pointResolution } = transform(geometry_smoothened)
  const geometry_utm = read(geometry_smoothened)
  return { read, write, resolution_point: pointResolution, geometry_utm }
}, ['geometry_key', 'geometry_smoothened']])


/**
 * resolution -
 * calculate exact resolution at first point of geometry.
 */
rules.generic.push([next => {
  const resolution = next.resolution_point(next.resolution_center)
  return { resolution }
}, ['resolution_center', 'resolution_point']])


/**
 * stroke_styles :: [ol/style/Style]
 */
rules.generic.push([next => {
  const { stroke, style } = next.style_factory
  const geometry = next.geometry_smoothened
  const stroke_styles = stroke().map(stroke => style({ geometry, stroke }))
  return { stroke_styles }
}, ['geometry_smoothened', 'style_factory']])


/**
 * style :: [ol/style/Style]
 */
rules.generic.push([next => {
  return {
    style: [
      ...next.stroke_styles,
      ...next.text_styles
    ]
  }
}, ['stroke_styles', 'text_styles']])
