import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import Polygon from './__Polygon'
import LineString from './__LineString'
import Point from './__Point'
import { style } from './__style'
import { echelonCode, identityCode, statusCode, parameterized, MODIFIERS } from '../../symbology/2525c'
import * as Colors from './color-schemes'
import * as Geometry from '../../model/geometry'
import styleRegistry from './styleRegistry'

const other = {
  simplifyGeometry: R.identity,
  smoothenGeometry: R.identity,
  style: () => Signal.of(style())
}

const geometryHooks = {
  Polygon,
  LineString,
  Point,
  other
}

export const $style = feature => {
  const geometryType = Geometry.geometryType(feature.getGeometry())
  const hooks = geometryHooks[geometryType] ?? geometryHooks.other

  feature.$definingGeometry = feature.$feature.map(feature => feature.getGeometry())
  feature.$properties = feature.$feature.map(feature => feature.getProperties())
  feature.$modifiers = feature.$properties.map(({ sidc, ...modifiers }) => modifiers)
  feature.$sidc = feature.$properties.map(R.prop('sidc'))

  feature.$symbolModifiers = Signal.link((properties) => {
    return Object.entries(properties)
      .filter(([key, value]) => MODIFIERS[key] && value)
      .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})
  }, [feature.$properties])

  feature.$parameterizedSIDC = feature.$sidc.map(parameterized)

  feature.$colorScheme = Signal.link((globalStyle, layerStyle, featureStyle) => {
    return featureStyle?.['color-scheme'] ||
      layerStyle?.['color-scheme'] ||
      globalStyle?.['color-scheme'] ||
      'medium'
  }, [feature.$globalStyle, feature.$layerStyle, feature.$featureStyle])

  feature.$schemeStyle = Signal.link((sidc, colorScheme) => {
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

  feature.$effectiveStyle = Signal.link((globalStyle, schemeStyle, layerStyle, featureStyle) => {
    if (!layerStyle['line-color']) delete layerStyle['line-color']
    if (!layerStyle['line-halo-color']) delete layerStyle['line-halo-color']

    return {
      ...globalStyle,
      ...schemeStyle,
      ...layerStyle,
      ...featureStyle
    }
  }, [feature.$globalStyle, feature.$schemeStyle, feature.$layerStyle, feature.$featureStyle])

  feature.$lineSmoothing = feature.$effectiveStyle.map(R.prop('line-smooth'))
  feature.$styleRegistry = feature.$effectiveStyle.map(styleRegistry)
  feature.$simplifiedGeometry = Signal.link(hooks.simplifyGeometry, [feature.$definingGeometry, feature.$resolution])

  feature.$smoothenedGeometry = Signal.link((simplifiedGeometry, lineSmoothing) => {
    return lineSmoothing ? hooks.smoothenGeometry(simplifiedGeometry) : simplifiedGeometry
  }, [feature.$simplifiedGeometry, feature.$lineSmoothing])

  return hooks.style(feature)
}
