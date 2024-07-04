import Signal from '@syncpoint/signal'
import defaultStyle from './defaultStyle'

import simplifiedGeometry from './_simplifiedGeometry'
import smoothenedGeometry from './_smoothenedGeometry'

export default $ => {
  $.simplifiedGeometry = Signal.link(simplifiedGeometry, [$.geometry, $.resolution])
  $.lineSmoothing = $.effectiveStyle.map(style => style['line-smooth'] || false)
  $.smoothenedGeometry = Signal.link(smoothenedGeometry, [$.simplifiedGeometry, $.lineSmoothing])
  $.utmSmoothenedGeometry = $.smoothenedGeometry.ap($.read)

  return $.smoothenedGeometry.map(geometry => defaultStyle({ geometry }))
}
