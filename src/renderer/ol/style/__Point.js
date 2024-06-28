import Signal from '@syncpoint/signal'
import * as Signals from './__Signals'
import { styleFactory } from './styleFactory'

const $style = feature => Signal.link((geometry, symbolModifiers, sidc, styleRegistry) => {
  const styleProps = [{
    id: 'style:2525c/symbol',
    geometry,
    'symbol-code': sidc,
    'symbol-modifiers': symbolModifiers,
    // TODO: selected styles
  }]
  return styleProps
    .map(styleRegistry)
    .flatMap(styleFactory)
}, [feature.$definingGeometry, feature.$symbolModifiers, feature.$sidc, feature.$styleRegistry])

export const Point = feature => {
  feature.$properties = Signals.$properties(feature)
  feature.$modifiers = Signals.$modifiers(feature)
  feature.$sidc = Signals.$sidc(feature)
  feature.$parameterizedSIDC = Signals.$parameterizedSIDC(feature)
  feature.$definingGeometry = Signals.$definingGeometry(feature)
  feature.$colorScheme = Signals.$colorScheme(feature)
  feature.$schemeStyle = Signals.$schemeStyle(feature)
  feature.$effectiveStyle = Signals.$effectiveStyle(feature)
  feature.$styleRegistry = Signals.$styleRegistry(feature)
  feature.$symbolModifiers = Signals.$symbolModifiers(feature)
  feature.$style = $style(feature)
}