/* eslint-disable camelcase */
import * as R from 'ramda'
import * as shared from './shared'
import { MODIFIERS } from '../../symbology/2525c'

const rules = [
  shared.sidc,
  shared.effectiveStyle
]

export default rules

const symbolModifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})


/**
 * style
 */
rules.push([next => {
  const { styleFactory, definingGeometry, sidc, modifiers } = next

  const props = {
    id: 'style:2525c/symbol',
    'symbol-code': sidc,
    'symbol-modifiers': symbolModifiers(modifiers)
  }

  return { style: styleFactory({ geometry: definingGeometry, ...props }) }
}, ['sidc', 'modifiers', 'styleFactory', 'geometryKey']])
