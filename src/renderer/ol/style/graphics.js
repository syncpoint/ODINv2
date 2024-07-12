import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import transform from './_transform'

import _rewrite from './_rewrite'
import _evalSync from './_evalSync'
import _clip from './_clip'

export default specifics => $ => {
  const [read, write, pointResolution] = transform($.geometry)
  $.read = read
  $.rewrite = write.map(fn => xs => xs.map(_rewrite(fn)))
  $.pointResolution = pointResolution
  $.resolution = $.centerResolution.ap($.pointResolution)
  $.clip = $.resolution.map(_clip)
  $.evalSync = Signal.link(_evalSync, [$.sidc, $.properties])

  specifics($)

  $.styles = Signal.link(
    (...styles) => styles.reduce(R.concat),
    [
      $.shape,
      $.labels,
      $.selection
    ]
  )

  return $.styles
    .ap($.styleRegistry)
    .ap($.evalSync)
    .ap($.clip)
    .ap($.rewrite)
    .ap($.styleFactory)
}
