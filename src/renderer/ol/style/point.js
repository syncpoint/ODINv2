import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { MODIFIERS } from '../../symbology/2525c'

/**
 *
 */
export default $ => {

  // Point also need to contribute simplified JTS/UTM geometry,
  // because it is used to derive selection styles.
  //
  $.jtsSimplifiedGeometry = $.geometry.ap($.read)

  // ==> Mandatory slots to derive resulting style:

  $.labels = Signal.of([])
  $.selection = Signal.of([])
  $.shape = Signal.link((properties, geometry) => {
    const sidc = properties.sidc

    const modifiers = Object.entries(properties)
      .filter(([key, value]) => MODIFIERS[key] && value)
      .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})

    return [{
      id: 'style:2525c/symbol',
      geometry,
      'symbol-code': sidc,
      'symbol-modifiers': modifiers
    }]
  }, [$.properties, $.jtsSimplifiedGeometry])

  // <== Mandatory slots
}
