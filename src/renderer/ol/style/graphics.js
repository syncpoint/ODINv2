import * as R from 'ramda'
import Signal from '@syncpoint/signal'

export default $ => {

  $.styles = Signal.link(
    (...styles) => styles.reduce(R.concat),
    [
      $.shape,
      $.labels,
      $.selection
  ])

  return $.styles
    .ap($.styleRegistry)
    .ap($.evalSync)
    .ap($.clip)
    .ap($.rewrite)
    .ap($.styleFactory)
}
