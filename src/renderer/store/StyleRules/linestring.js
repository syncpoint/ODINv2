/* eslint-disable camelcase */
import { rules } from './rules'

rules.LineString = [
  ...rules.shared,
  ...rules.generic
]

/**
 * simplified, geometry_simplified
 */
rules.LineString.push([next => {
  const geometry_defining = next.geometry_defining

  // Never simplify current selection.
  const simplified = next.mode === 'singleselect'
    ? false
    : geometry_defining.getCoordinates().length > 50

  const geometry_simplified = simplified
    ? geometry_defining.simplify(next.resolution)
    : geometry_defining

  return { simplified, geometry_simplified }
}, ['resolution', 'mode', 'geometry_key', 'geometry_defining']])
