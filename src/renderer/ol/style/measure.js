import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { STYLES } from '../interaction/measure/style'
import { baseStyle } from '../interaction/measure/baseStyle'

/**
 * @typedef {import('ol/style/Style').default} Style
 * @typedef {import('ol/geom/Geometry').default} Geometry
 * @typedef {import('@syncpoint/signal').Signal} Signal
 */

/**
 * @typedef {Object} MeasureStyleContext
 * @property {Signal<Geometry>} geometry - Signal containing the feature geometry
 * @property {Signal<string>} selectionMode - Signal containing the current selection mode
 * @property {Signal<string>} [geometryType] - Derived signal for geometry type
 * @property {Signal<boolean>} [selected] - Derived signal for selection state
 * @property {Signal<Style[]>} [baseStyle] - Derived signal for base styles
 * @property {Signal<function>} [styleFN] - Derived signal for geometry-specific style function
 * @property {Signal<Style[]>} [geometryStyle] - Derived signal for geometry-specific styles
 */

/**
 * Style orchestrator for measurement features.
 * Reactively combines base styles with geometry-specific styles based on selection state.
 * @param {MeasureStyleContext} $ - Context object with reactive signals
 * @returns {Signal<Style[]>} Signal emitting combined style arrays
 */
export default $ => {
  $.geometryType = $.geometry.map(geometry => geometry.getType())
  $.selected = $.selectionMode.map(mode => mode !== 'default')
  $.baseStyle = $.selected.map(baseStyle)
  $.styleFN = $.geometryType.map(type => STYLES[type])
  $.geometryStyle = $.geometry.ap($.styleFN)

  return Signal.link(
    (...styles) => styles.reduce(R.concat),
    [
      $.baseStyle,
      $.geometryStyle
    ]
  )
}
