/* eslint-disable camelcase */
import { rules } from './StyleRules-Rules'

rules.LineString = [
  ...rules.shared,
  ...rules.generic
]

/**
 * simplified, geometry_simplified
 */
rules.LineString.push([next => {
  const geometry = next.geometry

  // Never simplify current selection.
  const simplified = next.mode === 'singleselect'
    ? false
    : geometry.getCoordinates().length > 50

  const geometry_simplified = simplified
    ? geometry.simplify(next.resolution)
    : geometry

  return { simplified, geometry_simplified }
}, ['resolution', 'mode', 'geometry_key', 'geometry']])
