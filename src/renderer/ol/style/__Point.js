import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { styleFactory } from './styleFactory'

const style = feature => Signal.link((geometry, symbolModifiers, sidc, styleRegistry) => {
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

export default {
  simplifyGeometry: R.identity,
  smoothenGeometry: R.identity,
  style
}
