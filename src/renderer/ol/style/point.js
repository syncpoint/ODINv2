/* eslint-disable camelcase */
import * as R from 'ramda'
import * as shared from './shared'
import { styleFactory } from './styleFactory'
import { MODIFIERS } from '../../symbology/2525c'

const symbolModifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})

/**
 * style
 */
const style = [next => {
  const { mode, definingGeometry, sidc, modifiers, effectiveStyle } = next

  // symbol-text-color
  const selected = mode === 'singleselect'
    ? { 'symbol-halo-color': 'white', 'symbol-halo-width': 6, 'symbol-fill-opacity': 1 }
    : {}

  const style = [{
    id: 'style:2525c/symbol',
    geometry: definingGeometry,
    'symbol-code': sidc,
    'symbol-modifiers': symbolModifiers(modifiers),
    ...selected
  }]
    .map(effectiveStyle)
    .flatMap(styleFactory)

  return { style }
}, ['mode', 'sidc', 'modifiers', 'geometryKey', 'effectiveStyle']]


export default [
  shared.sidc,
  shared.effectiveStyle,
  style
]
