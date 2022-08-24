/* eslint-disable camelcase */
import * as R from 'ramda'
import { Stroke, Style, Fill, Text } from 'ol/style'
import { Jexl } from 'jexl'
import { rules } from './rules'
import * as Colors from '../../ol/style/color-schemes'
import { identityCode, parameterized } from '../../symbology/2525c'
import { smooth } from '../../ol/style/chaikin'
import { transform } from '../../model/geometry'

const jexl = new Jexl()

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
  const { 'line-smooth': line_smooth, ...style_effective } = merged

  const stroke = (() => {
    const haloColor = style_effective['line-halo-color']
    const color = style_effective['line-color']
    return (options = {}) => [
      new Stroke({ color: haloColor, width: 4, ...options }),
      new Stroke({ color, width: 3, ...options })
    ]
  })()

  const text = (() => {
    const font = style_effective['text-font'] || [
      style_effective['text-font-style'],
      style_effective['text-font-variant'],
      style_effective['text-font-weight'],
      style_effective['text-font-size'],
      style_effective['text-font-family']
    ].filter(Boolean).join(' ')

    const haloColor = style_effective['text-halo-color']
    const haloWidth = style_effective['text-halo-width']
    const stroke = haloColor && haloWidth
      ? new Stroke({ color: haloColor, width: haloWidth })
      : undefined

    const fillColor = style_effective['text-color']
    const fill = fillColor ? new Fill({ color: fillColor }) : undefined

    return (options = {}) => new Text({ font, stroke, fill, ...options })
  })()

  const style = options => new Style(options)

  const style_factory = {
    stroke,
    text,
    style
  }

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
