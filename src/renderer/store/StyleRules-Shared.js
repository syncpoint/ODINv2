/* eslint-disable camelcase */
import { rules } from './StyleRules-Rules'
import * as Colors from '../ol/style/color-schemes'
import { identityCode } from '../symbology/2525c'

rules.shared = {}

/**
 * sidc, sidc+identity
 */
rules.shared.sidc = [next => {
  const { sidc } = next.properties
  return { sidc, identity: identityCode(sidc) }
}, ['properties']]


/**
 * style+effective
 */
rules.shared.style_effective = [next => {
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
}, ['identity', 'style_default', 'style_layer', 'style_feature']]
