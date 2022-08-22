/* eslint-disable camelcase */
import { rules } from './StyleRules-Rules'

rules.Polygon = [
  ...rules.shared,
  ...rules.generic
]

/**
 * simplified, geometry_simplified
 */
rules.Polygon.push([next => {
  const geometry = next.geometry

  // Never simplify current selection.
  const simplified = next.mode === 'singleselect'
    ? false
    : geometry.getCoordinates()[0].length > 50

  const geometry_simplified = simplified
    ? geometry.simplify(next.resolution)
    : geometry

  return { simplified, geometry_simplified }
}, ['resolution', 'mode', 'geometry_key', 'geometry']])
