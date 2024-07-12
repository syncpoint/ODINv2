import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { MODIFIERS } from '../../symbology/2525c'

/**
 *
 */
export default $ => {
  $.shape = Signal.link((properties, geometry) => {
    const sidc = properties.sidc
    const modifiers = Object.entries(properties)
      .filter(([key, value]) => MODIFIERS[key] && value)
      .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})

    return [{
      id: 'style:2525c/symbol',
      geometry,
      'symbol-code': sidc,
      'symbol-modifiers': modifiers
    }]

  }, [$.properties, $.geometry])

  return $.shape
    .ap($.styleRegistry)
    .ap($.styleFactory)
}
