import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { MODIFIERS } from '../../symbology/2525c'

/**
 *
 */
export default $ => {
  $.shape = $.properties.map(properties => {

    // Custom SVG takes precedence over SIDC.
    // Features pushed via NIDO API may carry an 'svg' property with
    // inline SVG markup instead of a military symbol code (SIDC).
    if (properties.svg) {
      // Encode SVG to base64 for reliable data URI handling.
      // This avoids issues with special characters like # in color values
      // that would break a plain data:image/svg+xml;utf8, URI.
      const base64 = btoa(unescape(encodeURIComponent(properties.svg)))
      return [{
        id: 'style:custom-svg',
        'icon-url': 'data:image/svg+xml;base64,' + base64,
        'icon-scale': properties['icon-scale'] || 1,
        'icon-anchor': properties['icon-anchor'] || [0.5, 0.5]
      }]
    }

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
