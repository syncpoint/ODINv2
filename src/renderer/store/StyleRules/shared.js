/* eslint-disable camelcase */
import * as Colors from '../../ol/style/color-schemes'
import { identityCode, statusCode, parameterized } from '../../symbology/2525c'
import { styleFactory } from './styleFactory'

const rules = []

/**
 * sidc, parameterizedSIDC, identity, status
 */
rules.push([next => {
  const { sidc } = next.properties
  const parameterizedSIDC = parameterized(sidc)

  return { sidc, parameterizedSIDC }
}, ['properties']])


/**
 * smoothen, effectiveStyle
 */
rules.push([next => {
  const global = next.globalStyle || {}
  const layer = next.layerStyle || {}
  const feature = next.featureStyle || {}

  const { sidc } = next
  const status = statusCode(sidc)
  const identity = identityCode(sidc)
  const simpleIdentity = identity === 'H' || identity === 'S'
    ? 'H'
    : '-'

  const colorScheme = feature?.['color-scheme'] ||
    layer?.['color-scheme'] ||
    global?.['color-scheme'] ||
    'medium'

  const scheme = {
    'binary-color': Colors.lineColor(colorScheme)(simpleIdentity), // black or red
    'line-color': Colors.lineColor(colorScheme)(identity),
    'fill-color': Colors.lineColor(colorScheme)(identity),
    'line-dash-array': status === 'A' ? [20, 10] : null,
    'line-halo-color': Colors.lineHaloColor(identity),
    'line-halo-dash-array': status === 'A' ? [20, 10] : null
  }

  // Split `smoothen` from rest.
  // We don't want to calculate new geometries on color change.
  const merged = { ...global, ...layer, ...scheme, ...feature }
  const { 'line-smooth': smoothen, ...effectiveStyle } = merged

  return {
    smoothen: !!smoothen,
    effectiveStyle
  }
}, ['sidc', 'globalStyle', 'layerStyle', 'featureStyle']])


/**
 * styleFactory
 */
rules.push([next => {
  const { effectiveStyle } = next
  return { styleFactory: styleFactory(effectiveStyle) }
}, ['effectiveStyle']])

export default rules
