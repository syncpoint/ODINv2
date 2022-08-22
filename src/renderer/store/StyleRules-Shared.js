/* eslint-disable camelcase */
import { Stroke, Style } from 'ol/style'
import { rules } from './StyleRules-Rules'
import * as Colors from '../ol/style/color-schemes'
import { identityCode } from '../symbology/2525c'
import { smooth } from '../ol/style/chaikin'

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
 * simplified, geometry_smooth
 */
rules.generic.push([next => {
  if (!next.style_effective) return /* not quite yet */
  const geometry = next.geometry_simplified
  const geometry_smooth = next.line_smooth
    ? smooth(geometry)
    : geometry

  return { geometry_smooth }
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
 * style
 */
rules.generic.push([next => {
  const geometry = next.geometry_smooth
  const line = next.line_default
  return { style: line(geometry) }
}, ['geometry_smooth', 'line_default']])
