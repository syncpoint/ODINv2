import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { MODIFIERS } from '../../symbology/2525c'

/**
 *
 */
export default $ => {
  $.shape = $.properties.map(properties => {
    const sidc = properties.sidc
    const modifiers = Object.entries(properties)
      .filter(([key, value]) => MODIFIERS[key] && value)
      .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})

    return [{
      id: 'style:2525c/symbol',
      'symbol-code': sidc,
      'symbol-modifiers': modifiers
    }]
  }, [])

  $.selection = $.selectionMode.map(mode =>
    mode === 'multiselect'
      ? [{ id: 'style:rectangle-handle' }]
      : []
  )

  $.styles = Signal.link(
    (...styles) => styles.reduce(R.concat),
    [
      $.shape,
      $.selection
    ]
  )

  return $.styles
    .ap($.styleRegistry)
    .ap($.styleFactory)
}
