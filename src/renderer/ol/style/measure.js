import * as R from 'ramda'
import Signal from '@syncpoint/signal'
import { STYLES } from '../interaction/measure/style'
import { baseStyle } from '../interaction/measure/baseStyle'

export default $ => {
  $.selected = $.selectionMode.map(mode => mode !== 'default')
  $.baseStyle = $.selected.map(baseStyle)
  $.styleFN = $.geometryType.map(type => STYLES[type])
  $.geometryStyle = $.geometry.ap($.styleFN)

  return Signal.link(
    (...styles) => styles.reduce(R.concat),
    [
      $.baseStyle,
      $.geometryStyle
    ]
  )
}
