/* eslint-disable camelcase */
import { Stroke, Style } from 'ol/style'
import isEqual from 'react-fast-compare'
import { identityCode } from '../symbology/2525c'
import * as Colors from '../ol/style/color-schemes'
import { smooth } from '../ol/style/chaikin'

/**
 *
 */
export const FeatureHolder = function (feature, state) {
  this.feature = feature
  this.state = state
  this.id = feature.getId()
  this.feature.setStyle(this.style.bind(this))

  // Triggered for each changed property individually, incl. geometry.
  feature.on('propertychange', event => {
    const { key } = event
    const value = this.feature.get(key)
    this.state = this.reduce(this.state, { [key]: value })
  })
}


/**
 *
 */
FeatureHolder.prototype.reduce = function (state, obj) {

  // TODO: hoist
  const notDeepEqual = key => !isEqual(state[key], obj[key])
  const comparators = {
    style_default: notDeepEqual,
    style_layer: notDeepEqual,
    style_feature: notDeepEqual,
    style_effective: notDeepEqual,
    properties: notDeepEqual
  }

  const changed = Object.keys(obj).filter(key => {
    const comparator = comparators[key] || (key => state[key] !== obj[key])
    return comparator(key)
  })

  if (changed.length === 0) return state
  console.log('[FeatureHolder/reduce]', changed)

  const next = { ...state, ...obj }
  const rules = this.rules.filter(rule => rule[1].some(key => changed.includes(key)))
  const acc = rules.reduce((acc, rule) => ({ ...acc, ...rule[0](next) }), {})

  if (Object.keys(acc).length !== 0) return this.reduce(next, acc)
  else return next
}


/**
 *
 */
FeatureHolder.prototype.apply = function (obj, changed) {
  this.state = this.reduce(this.state, obj)
  if (changed) this.feature.changed()
}


/**
 *
 */
FeatureHolder.prototype.style = function (feature, resolution) {
  const { geometry, ...properties } = feature.getProperties()
  this.state = this.reduce(this.state, {
    geometry,
    properties,
    resolution,
    geometry_key: `${geometry.ol_uid}:${geometry.getRevision()}`
  })

  return this.state.style
}

FeatureHolder.prototype.dispose = function () {
  delete this.feature
  delete this.state
}

FeatureHolder.prototype.rules = []


/**
 * simplified, geometry_simplified
 */
FeatureHolder.prototype.rules.push([next => {
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
FeatureHolder.prototype.rules.push([next => {
  const { sidc } = next.properties
  return { sidc, identity: identityCode(sidc) }
}, ['properties']])


/**
 * style+effective
 */
FeatureHolder.prototype.rules.push([next => {
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
FeatureHolder.prototype.rules.push([next => {
  if (!next.style_effective) return /* not quite yet */
  const geometry = next.geometry_simplified
  const geometry_smooth = next.line_smooth
    ? smooth(geometry)
    : geometry

  return { geometry_smooth }
}, ['line_smooth', 'geometry_simplified']])


/**
 * line+default
 */
FeatureHolder.prototype.rules.push([next => {
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
FeatureHolder.prototype.rules.push([next => {
  const geometry = next.geometry_smooth
  const line = next.line_default
  return { style: line(geometry) }
}, ['geometry_smooth', 'line_default']])
