import { Circle, Fill, Stroke, Style } from 'ol/style'

/**
 * @typedef {import('ol/style/Style').default} Style
 */

/** @type {string} */
export const FONT = '12px sans-serif'

/**
 * Creates an array of base styles for measurement geometries.
 * Includes a primary colored stroke (blue if selected, red otherwise),
 * a white dashed overlay stroke, and blue circle points at vertices.
 * @param {boolean} selected - Whether the measurement is currently selected
 * @returns {Style[]} Array of OpenLayers Style objects
 */
export const baseStyle = selected => [
  new Style({
    stroke: new Stroke({
      color: selected ? 'blue' : 'red',
      width: 4
    })
  }),
  new Style({
    stroke: new Stroke({
      color: 'white',
      lineDash: [15, 15],
      width: 4
    })
  }),
  new Style({
    image: new Circle({
      radius: 4,
      fill: new Fill({
        color: 'blue'
      })
    })
  })
]
