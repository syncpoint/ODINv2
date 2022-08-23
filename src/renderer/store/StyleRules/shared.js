/* eslint-disable camelcase */
import { Stroke, Style } from 'ol/style'
import { rules } from './rules'
import * as Colors from '../../ol/style/color-schemes'
import { identityCode, parameterized } from '../../symbology/2525c'
import { smooth } from '../../ol/style/chaikin'
import { transform } from '../../model/geometry'

rules.shared = []
rules.generic = [] // LineString, Polygon

/**
 * sidc, sidc+identity
 */
rules.shared.push([next => {
  const { sidc } = next.properties
  return { sidc, identity: identityCode(sidc) }
}, ['properties']])


/**
 * sidc_parameterized
 */
rules.shared.push([next => {
  const sidc_parameterized = parameterized(next.sidc)
  return { sidc_parameterized }
}, ['sidc']])


/**
 * style+effective
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
  return { line_smooth, style_effective }
}, ['identity', 'style_default', 'style_layer', 'style_feature']])


/**
 * simplified, geometry_smoothened
 */
rules.generic.push([next => {
  if (!next.style_effective) return /* not quite yet */
  const geometry_simplified = next.geometry_simplified
  const geometry_smoothened = next.line_smooth
    ? smooth(geometry_simplified)
    : geometry_simplified

  return { geometry_smoothened }
}, ['line_smooth', 'geometry_key', 'geometry_simplified']])


/**
 * line+default
 */
rules.generic.push([next => {
  const style_effective = next.style_effective
  const strokes = [
    new Stroke({ color: style_effective['line-halo-color'], width: 4 }),
    new Stroke({ color: style_effective['line-color'], width: 3 })
  ]

  const style = geometry => stroke => new Style({ geometry, stroke })
  const line_default = geometry => strokes.map(style(geometry))
  return { line_default }
}, ['style_effective']])


/**
 * read, write, resolution_point, geometry_utm
 */
rules.generic.push([next => {
  const geometry_smoothened = next.geometry_smoothened
  if (!geometry_smoothened) return

  const { read, write, pointResolution } = transform(geometry_smoothened)
  const geometry_utm = read(geometry_smoothened)
  return { read, write, resolution_point: pointResolution, geometry_utm }
}, ['geometry_key', 'geometry_smoothened']])


/**
 * resolution -
 * calculate exact resolution at first point of geometry.
 */
rules.generic.push([next => {
  if (!next.resolution_point) return
  const resolution = next.resolution_point(next.resolution_center)
  return { resolution }
}, ['resolution_center', 'resolution_point']])


/**
 * style_stoke :: [ol/style/Style]
 */
rules.generic.push([next => {
  const geometry_smoothened = next.geometry_smoothened
  const line = next.line_default
  return { style_stroke: line(geometry_smoothened) }
}, ['geometry_smoothened', 'line_default']])


/**
 * style :: [ol/style/Style]
 */
rules.generic.push([next => {
  const stroke = next.style_stroke
  const text = next.style_text
  if (!stroke || !text) return

  return { style: [...stroke, ...text] }
}, ['style_stroke', 'style_text']])
