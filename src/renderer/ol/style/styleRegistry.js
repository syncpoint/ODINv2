import { PI_OVER_4 } from '../../../shared/Math'

const COLOR_WHITE = 'white'
const COLOR_BLACK = 'black'
const COLOR_YELLOW = 'yellow'
const COLOR_RED_60 = 'rgba(255,0,0,0.6)'
const DASH_ARRAY_10_10 = [10, 10]
const DASH_ARRAY_14_6 = [14, 6]
const DASH_ARRAY_20_8_2_8 = [20, 8, 2, 8]

/**
 * Registry of predefined styles.
 */
export default (options) => {

  const font = options['text-font'] || [
    options['text-font-style'],
    options['text-font-variant'],
    options['text-font-weight'],
    options['text-font-size'],
    options['text-font-family']
  ].filter(Boolean).join(' ')

  const registry = {}

  registry['style:2525c/symbol'] = {
    'color-scheme': options['color-scheme'],
    'symbol-color': options['symbol-color'],
    'symbol-halo-color': options['symbol-halo-color'],
    'symbol-halo-width': options['symbol-halo-width'],
    'symbol-text-color': options['symbol-text-color'],
    'symbol-text-halo-color': options['symbol-text-halo-color'],
    'symbol-text-halo-width': options['symbol-text-halo-width'],
    'symbol-text-size': options['symbol-text-size'],
    'symbol-text': options['symbol-text'],
    'symbol-fill': options['symbol-fill'],
    'symbol-fill-opacity': options['symbol-fill-opacity'],
    'symbol-frame': options['symbol-frame'],
    'symbol-icon': options['symbol-icon'],
    'symbol-line-width': options['symbol-line-width'],
    'symbol-size': options['symbol-size'],
    'icon-scale': options['icon-scale']
  }

  registry['style:2525c/default-stroke'] = {
    'line-cap': options['line-cap'],
    'line-join': options['line-join'],
    'line-color': options['line-color'],
    'line-width': options['line-width'],
    'line-dash-array': options['line-dash-array'],
    'line-halo-color': options['line-halo-color'],
    'line-halo-width': options['line-halo-width'],
    'line-halo-dash-array': options['line-halo-dash-array']
  }

  registry['style:2525c/solid-stroke'] = {
    'line-cap': options['line-cap'],
    'line-join': options['line-join'],
    'line-color': options['line-color'],
    'line-width': options['line-width'],
    'line-halo-color': options['line-halo-color'],
    'line-halo-width': options['line-halo-width']
  }

  registry['style:2525c/dashed-stroke'] = {
    'line-cap': options['line-cap'],
    'line-join': options['line-join'],
    'line-color': options['line-color'],
    'line-width': options['line-width'],
    'line-dash-array': DASH_ARRAY_14_6,
    'line-halo-color': options['line-halo-color'],
    'line-halo-width': options['line-halo-width'],
    'line-halo-dash-array': DASH_ARRAY_14_6
  }

  registry['style:2525c/solid-fill'] = {
    'line-cap': options['line-cap'],
    'line-join': options['line-join'],
    'line-color': options['line-color'],
    'line-width': options['line-width'],
    'line-halo-color': options['line-halo-color'],
    'line-halo-width': options['line-halo-width'],
    'fill-color': options['fill-color']
  }

  registry['style:2525c/hatch-fill'] = {
    'line-cap': options['line-cap'],
    'line-join': options['line-join'],
    'line-color': options['line-color'],
    'line-width': options['line-width'],
    'line-halo-color': options['line-halo-color'],
    'line-halo-width': options['line-halo-width'],
    'fill-pattern': 'hatch',
    'fill-pattern-angle': 45,
    'fill-pattern-size': 2,
    'fill-pattern-spacing': 12
  }

  registry['style:default-text'] = {
    'text-font': font,
    'text-color': options['text-color'],
    'text-fill-color': options['text-fill-color'],
    'text-line-color': options['text-line-color'],
    'text-line-width': options['text-line-width'],
    'text-halo-color': options['text-halo-color'],
    'text-halo-width': options['text-halo-width'],
    'text-justify': 'center',
    'text-rotation-anchor': 'auto'
  }

  registry['style:2525c/fence-stroke'] = {
    'line-cap': 'square',
    'line-color': options['binary-color'],
    'line-width': 2
  }

  registry['style:2525c/fence-o'] = {
    'shape-line-color': options['binary-color'],
    'shape-line-width': 2,
    'shape-points': 8,
    'shape-radius': 8,
    'shape-radius-2': 8,
    'shape-angle': PI_OVER_4,
    'shape-scale': [0.8, 1.4]
  }

  registry['style:2525c/fence-x'] = {
    'shape-line-color': options['binary-color'],
    'shape-line-width': 2,
    'shape-points': 4,
    'shape-radius': 8,
    'shape-radius-2': 0,
    'shape-angle': PI_OVER_4,
    'shape-scale': [1, 1.4]
  }

  registry['style:wasp-stroke'] = {
    'line-color': COLOR_YELLOW,
    'line-width': options['line-width'],
    'line-dash-array': DASH_ARRAY_10_10,
    'line-halo-color': COLOR_BLACK,
    'line-halo-width': options['line-halo-width'],
    'line-halo-dash-array': null
  }

  registry['style:circle-handle'] = {
    'circle-fill-color': COLOR_RED_60,
    'circle-line-color': 'white',
    'circle-line-width': 3,
    'circle-radius': 7
  }

  registry['style:rectangle-handle'] = {
    'shape-fill-color': COLOR_WHITE,
    'shape-line-color': 'black',
    'shape-line-width': 1,
    'shape-radius': 6,
    'shape-points': 4,
    'shape-angle': PI_OVER_4
  }

  registry['style:guide-stroke'] = {
    'line-color': 'red',
    'line-dash-array': DASH_ARRAY_20_8_2_8,
    'line-width': 1.5
  }

  // Custom SVG icon style - used by NIDO API for custom point graphics
  registry['style:custom-svg'] = {
    'icon-scale': 1
  }

  // Shape styles - lines and polygons without military semantics
  registry['style:shape/stroke'] = {
    'line-color': options['line-color'] || '#000000',
    'line-width': options['line-width'] || 2,
    'line-cap': 'round',
    'line-join': 'round'
  }

  registry['style:shape/fill'] = {
    'line-color': options['line-color'] || '#000000',
    'line-width': options['line-width'] || 2,
    'line-cap': 'round',
    'line-join': 'round',
    'fill-color': options['fill-color']
  }

  return ({ id, ...props }) => ({ ...(registry[id] || {}), ...props })
}
