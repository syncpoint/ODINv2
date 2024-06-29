import * as R from 'ramda'
import { MODIFIERS } from '../../symbology/2525c'

/**
 *
 */
export default (properties) => {
  return Object.entries(properties)
    .filter(([key, value]) => MODIFIERS[key] && value)
    .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})
}
