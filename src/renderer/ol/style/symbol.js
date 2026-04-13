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
      // icon-rotate is specified in degrees in the feature properties
      // but OpenLayers expects radians.
      const rotation = properties['icon-rotate']
        ? properties['icon-rotate'] * (Math.PI / 180)
        : 0

      return [{
        id: 'style:custom-svg',
        'icon-url': 'data:image/svg+xml;base64,' + base64,
        'icon-scale': properties['icon-scale'] || 1,
        'icon-anchor': properties['icon-anchor'] || [0.5, 0.5],
        'icon-rotate': rotation
      }]
    }

    const sidc = properties.sidc

    // Fallback: features without an SIDC (and without a custom SVG) would
    // otherwise produce a Style with no image and stay invisible on the map.
    // Render OpenLayers' canonical blue dot so the feature is at least locatable.
    if (!sidc) {
      return [{
        id: 'style:default/bluedot',
        'circle-radius': 6,
        'circle-fill-color': 'rgba(51,153,204,1)',
        'circle-line-color': '#ffffff',
        'circle-line-width': 1.5
      }]
    }

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
