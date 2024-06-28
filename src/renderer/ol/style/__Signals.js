import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { echelonCode, identityCode, statusCode, parameterized } from '../../symbology/2525c'
import * as Colors from './color-schemes'
import styleRegistry from './styleRegistry'
import { smooth } from './chaikin'
import { MODIFIERS } from '../../symbology/2525c'

export const $properties = feature => feature.$feature.map(feature => feature.getProperties())
export const $sidc = feature => feature.$properties.map(R.prop('sidc'), )
export const $parameterizedSIDC = feature => feature.$sidc.map(parameterized)
export const $modifiers = feature => feature.$properties.map(({ sidc, ...rest }) => rest)
export const $definingGeometry = feature => feature.$feature.map(feature => feature.getGeometry())

export const $smoothenedGeometry = feature => Signal.link((geometry, lineSmoothing) => {
  return lineSmoothing ? smooth(geometry) : geometry
}, [feature.$simplifiedGeometry, feature.$lineSmoothing])

export const $colorScheme = feature => Signal.link((globalStyle, layerStyle, featureStyle) => {
  return featureStyle?.['color-scheme'] ||
    layerStyle?.['color-scheme'] ||
    globalStyle?.['color-scheme'] ||
    'medium'
}, [feature.$globalStyle, feature.$layerStyle, feature.$featureStyle])

export const $schemeStyle = feature => Signal.link((sidc, colorScheme) => {
  const status = statusCode(sidc)
  const identity = identityCode(sidc)
  const simpleIdentity = identity === 'H' || identity === 'S'
    ? 'H'
    : '-'

  return {
    'binary-color': Colors.lineColor(colorScheme)(simpleIdentity), // black or red
    'line-color': Colors.lineColor(colorScheme)(identity),
    'fill-color': Colors.lineColor(colorScheme)(identity),
    'line-dash-array': status === 'A' ? [20, 10] : null,
    'line-halo-color': Colors.lineHaloColor(identity),
    'line-halo-dash-array': status === 'A' ? [20, 10] : null
  }
}, [feature.$sidc, feature.$colorScheme])

export const $effectiveStyle = feature => Signal.link((globalStyle, schemeStyle, layerStyle, featureStyle) => {
  if (!layerStyle['line-color']) delete layerStyle['line-color']
  if (!layerStyle['line-halo-color']) delete layerStyle['line-halo-color']

  return {
    ...globalStyle,
    ...schemeStyle,
    ...layerStyle,
    ...featureStyle
  }

}, [feature.$globalStyle, feature.$schemeStyle, feature.$layerStyle, feature.$featureStyle])

export const $lineSmoothing = feature => feature.$effectiveStyle.map(R.prop('line-smooth'))
export const $styleRegistry = feature => feature.$effectiveStyle.map(styleRegistry)

export const $symbolModifiers = feature => Signal.link((properties) => {
  return Object.entries(properties)
    .filter(([key, value]) => MODIFIERS[key] && value)
    .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})
}, [feature.$properties])