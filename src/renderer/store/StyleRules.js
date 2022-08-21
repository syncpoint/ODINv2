/* eslint-disable camelcase */
import * as R from 'ramda'
import isEqual from 'react-fast-compare'
import { identityCode } from '../symbology/2525c'
import * as Colors from '../ol/style/color-schemes'
import { smooth } from '../ol/style/chaikin'
import { Stroke, Style } from 'ol/style'

const notDeepEqual = (state, obj, key) => !isEqual(state[key], obj[key])

const comparators = {
  style_default: notDeepEqual,
  style_layer: notDeepEqual,
  style_feature: notDeepEqual,
  style_effective: notDeepEqual,
  properties: notDeepEqual
}

/**
 *
 */
export const reduce = (state, obj) => {
  const different = key => comparators[key]
    ? comparators[key](state, obj, key)
    : state[key] !== obj[key]

  const changed = Object.keys(obj).filter(different)
  if (changed.length === 0) return state

  const next = { ...state, ...obj }
  const depends = rule => rule[1].some(key => changed.includes(key))
  const merger = (acc, rule) => ({ ...acc, ...rule[0](next) })
  const acc = state.rules.filter(depends).reduce(merger, {})
  return R.isEmpty(acc) ? next : reduce(next, acc)
}

export const LineString = []

/**
 * simplified, geometry_simplified
 */
LineString.push([next => {
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
 * sidc, sidc+identity
 */
LineString.push([next => {
  const { sidc } = next.properties
  return { sidc, identity: identityCode(sidc) }
}, ['properties']])

LineString.push([next => {
  console.log('funny idea: change rule set if necessary')
  return {}
}, ['sidc']])

/**
 * style+effective
 */
LineString.push([next => {
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
LineString.push([next => {
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
LineString.push([next => {
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
LineString.push([next => {
  const geometry = next.geometry_smooth
  const line = next.line_default
  return { style: line(geometry) }
}, ['geometry_smooth', 'line_default']])
