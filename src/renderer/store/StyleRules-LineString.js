/* eslint-disable camelcase */
import { smooth } from '../ol/style/chaikin'
import { Stroke, Style } from 'ol/style'
import { rules } from './StyleRules-Rules'

rules.LineString = []
const _ = rules.LineString

_.push(rules.shared.sidc)
_.push(rules.shared.style_effective)

/**
 * simplified, geometry_simplified
 */
_.push([next => {
  const geometry = next.geometry

  // Never simplify current selection.
  const simplified = next.mode === 'singleselect'
    ? false
    : geometry.getType() === 'Polygon'
      ? geometry.getCoordinates()[0].length > 50
      : geometry.getType() === 'LineString'
        ? geometry.getCoordinates().length > 50
        : false

  const geometry_simplified = simplified
    ? geometry.simplify(next.resolution)
    : geometry

  return { simplified, geometry_simplified }
}, ['resolution', 'mode', 'geometry_key', 'geometry']])


/**
 * simplified, geometry_smooth
 */
_.push([next => {
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
_.push([next => {
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
_.push([next => {
  const geometry = next.geometry_smooth
  const line = next.line_default
  return { style: line(geometry) }
}, ['geometry_smooth', 'line_default']])
