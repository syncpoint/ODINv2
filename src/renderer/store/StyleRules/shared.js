/* eslint-disable camelcase */
import { Jexl } from 'jexl'
import * as Colors from '../../ol/style/color-schemes'
import { identityCode, statusCode, parameterized } from '../../symbology/2525c'
import { styleFactory } from './styleFactory'

const rules = []
const jexl = new Jexl()

/**
 * sidc, parameterizedSIDC, evalTextField
 */
rules.push([next => {
  const { properties } = next
  const { sidc } = properties
  const parameterizedSIDC = parameterized(sidc)

  const evalSync = textField => Array.isArray(textField)
    ? textField.map(evalSync).filter(Boolean).join('\n')
    : jexl.evalSync(textField, properties)

  const evalTextField = specs => {
    if (!Array.isArray(specs)) return evalTextField([specs])
    return specs.reduce((acc, spec) => {
      if (!spec['text-field']) acc.push(spec)
      else {
        const textField = evalSync(spec['text-field'])
        if (textField) acc.push({ ...spec, 'text-field': textField })
      }

      return acc
    }, [])
  }

  return { sidc, parameterizedSIDC, evalTextField }
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
