const COLOR_WHITE = 'white'
const COLOR_BLACK = 'black'
const COLOR_YELLOW = 'yellow'
const COLOR_RED_60 = 'rgba(255,0,0,0.6)'
const DASH_ARRAY_10_10 = [10, 10]
const DASH_ARRAY_14_6 = [14, 6]
const DASH_ARRAY_20_8_2_8 = [20, 8, 2, 8]

export default ({ PI_OVER_4 }, props) => {

  const font = props['text-font'] || [
    props['text-font-style'],
    props['text-font-variant'],
    props['text-font-weight'],
    props['text-font-size'],
    props['text-font-family']
  ].filter(Boolean).join(' ')

  const registry = {}

  registry['style:2525c/symbol'] = {
    'color-scheme': props['color-scheme'],
    'symbol-color': props['symbol-color'],
    'symbol-halo-color': props['symbol-halo-color'],
    'symbol-halo-width': props['symbol-halo-width'],
    'symbol-text-color': props['symbol-text-color'],
    'symbol-text-halo-color': props['symbol-text-halo-color'],
    'symbol-text-halo-width': props['symbol-text-halo-width'],
    'symbol-text-size': props['symbol-text-size'],
    'symbol-text': props['symbol-text'],
    'symbol-fill': props['symbol-fill'],
    'symbol-fill-opacity': props['symbol-fill-opacity'],
    'symbol-frame': props['symbol-frame'],
    'symbol-icon': props['symbol-icon'],
    'symbol-line-width': props['symbol-line-width'],
    'symbol-size': props['symbol-size'],
    'icon-scale': props['icon-scale']
  }

  registry['style:2525c/default-stroke'] = {
    'line-cap': props['line-cap'],
    'line-join': props['line-join'],
    'line-color': props['line-color'],
    'line-width': props['line-width'],
    'line-dash-array': props['line-dash-array'],
    'line-halo-color': props['line-halo-color'],
    'line-halo-width': props['line-halo-width'],
    'line-halo-dash-array': props['line-halo-dash-array']
  }

  registry['style:2525c/solid-stroke'] = {
    'line-cap': props['line-cap'],
    'line-join': props['line-join'],
    'line-color': props['line-color'],
    'line-width': props['line-width'],
    'line-halo-color': props['line-halo-color'],
    'line-halo-width': props['line-halo-width']
  }

  registry['style:2525c/dashed-stroke'] = {
    'line-cap': props['line-cap'],
    'line-join': props['line-join'],
    'line-color': props['line-color'],
    'line-width': props['line-width'],
    'line-dash-array': DASH_ARRAY_14_6,
    'line-halo-color': props['line-halo-color'],
    'line-halo-width': props['line-halo-width'],
    'line-halo-dash-array': DASH_ARRAY_14_6
  }

  registry['style:2525c/solid-fill'] = {
    'line-cap': props['line-cap'],
    'line-join': props['line-join'],
    'line-color': props['line-color'],
    'line-width': props['line-width'],
    'line-halo-color': props['line-halo-color'],
    'line-halo-width': props['line-halo-width'],
    'fill-color': props['fill-color']
  }

  registry['style:2525c/hatch-fill'] = {
    'line-cap': props['line-cap'],
    'line-join': props['line-join'],
    'line-color': props['line-color'],
    'line-width': props['line-width'],
    'line-halo-color': props['line-halo-color'],
    'line-halo-width': props['line-halo-width'],
    'fill-pattern': 'hatch',
    'fill-pattern-angle': 45,
    'fill-pattern-size': 2,
    'fill-pattern-spacing': 12
  }

  registry['style:default-text'] = {
    'text-font': font,
    'text-color': props['text-color'],
    'text-fill-color': props['text-fill-color'],
    'text-line-color': props['text-line-color'],
    'text-line-width': props['text-line-width'],
    'text-halo-color': props['text-halo-color'],
    'text-halo-width': props['text-halo-width'],
    'text-justify': 'center',
    'text-rotation-anchor': 'auto'
  }

  registry['style:2525c/fence-stroke'] = {
    'line-cap': 'square',
    'line-color': props['binary-color'],
    'line-width': 2
  }

  registry['style:2525c/fence-o'] = {
    'shape-line-color': props['binary-color'],
    'shape-line-width': 2,
    'shape-points': 8,
    'shape-radius': 8,
    'shape-radius-2': 8,
    'shape-angle': PI_OVER_4,
    'shape-scale': [0.8, 1.4]
  }

  registry['style:2525c/fence-x'] = {
    'shape-line-color': props['binary-color'],
    'shape-line-width': 2,
    'shape-points': 4,
    'shape-radius': 8,
    'shape-radius-2': 0,
    'shape-angle': PI_OVER_4,
    'shape-scale': [1, 1.4]
  }

  registry['style:wasp-stroke'] = {
    'line-color': COLOR_YELLOW,
    'line-width': props['line-width'],
    'line-dash-array': DASH_ARRAY_10_10,
    'line-halo-color': COLOR_BLACK,
    'line-halo-width': props['line-halo-width'],
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

  return ({ id, ...props }) => ({ ...(registry[id] || {}), ...props })
}
