import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { MODIFIERS } from '../../symbology/2525c'
import { styleFactory } from './styleFactory'

/**
 *
 */
export default $ => Signal.link((feature, styleRegistry) => {
  const { geometry, sidc, ...properties } = feature.getProperties()

  const modifiers = Object.entries(properties)
    .filter(([key, value]) => MODIFIERS[key] && value)
    .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})

  return [{
    id: 'style:2525c/symbol',
    geometry,
    'symbol-code': sidc,
    'symbol-modifiers': modifiers
  }]
    .map(styleRegistry)
    .flatMap(styleFactory)
}, [$.feature, $.styleRegistry])
