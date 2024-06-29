import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { styleFactory } from './styleFactory'

const mainStyles = $ => Signal.link((geometry, symbolModifiers, sidc) => [{
  id: 'style:2525c/symbol',
  geometry,
  'symbol-code': sidc,
  'symbol-modifiers': symbolModifiers
}], [$.geometry, $.symbolModifiers, $.sidc])

const style = $ => Signal.link((geometry, symbolModifiers, sidc, styleRegistry) => {
  const styleProps = [{
    id: 'style:2525c/symbol',
    geometry,
    'symbol-code': sidc,
    'symbol-modifiers': symbolModifiers
  }]
  return styleProps
    .map(styleRegistry)
    .flatMap(styleFactory)
}, [$.definingGeometry, $.symbolModifiers, $.sidc, $.styleRegistry])

export default {
  simplifyGeometry: R.identity,
  smoothenGeometry: R.identity,
  labels: R.always([]),
  labelPlacement: R.always(R.identity),
  mainStyles,
  style
}
