import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { MODIFIERS } from '../../symbology/2525c'

/**
 *
 */
export default $ => {
  $.shape = Signal.link(
    (properties, show) => {
      const sidc = properties.sidc
      const modifiers = show
        ? Object.entries(properties)
            .filter(([key, value]) => MODIFIERS[key] && value)
            .reduce((acc, [key, value]) => {
              acc[MODIFIERS[key]] = value
              return acc
            }, {})
        : {}

      return [{
        id: 'style:2525c/symbol',
        'symbol-code': sidc,
        'symbol-modifiers': modifiers
      }]
    },
    [$.properties, $.symbolPropertiesShowing]
  )

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
