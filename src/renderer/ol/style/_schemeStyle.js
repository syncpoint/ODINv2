import * as Colors from './color-schemes'
import { identityCode, statusCode } from '../../symbology/2525c'

/**
 *
 */
export default (sidc, colorScheme) => {
  // No scheme style for features without SIDC (e.g. shapes)
  if (!sidc) return {}

  const status = statusCode(sidc)
  const identity = identityCode(sidc)
  const simpleIdentity = identity === 'H' || identity === 'S'
    ? 'H'
    : '-'

  return {
    'binary-color': Colors.lineColor(colorScheme)(simpleIdentity), // black or red
    'line-color': Colors.lineColor(colorScheme)(identity),
    'fill-color': Colors.lineColor(colorScheme)(identity),
    'line-dash-array': status === 'A' ? [20, 10] : null,
    'line-halo-color': Colors.lineHaloColor(identity),
    'line-halo-dash-array': status === 'A' ? [20, 10] : null
  }
}
