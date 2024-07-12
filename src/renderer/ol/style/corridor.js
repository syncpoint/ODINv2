import Signal from '@syncpoint/signal'
import styles from './corridor-styles/index'
import graphics from './graphics'

import _context from './_context'
import _shape from './_shape'
import _selection from './_selection'

const specifics = $ => {
  $.jtsGeometry = $.geometry.ap($.read)
  $.context = Signal.link(_context, [$.jtsGeometry, $.resolution])
  $.shape = $.context.ap($.parameterizedSIDC.map(_shape(styles)))
  $.selection = Signal.link(_selection, [$.selectionMode, $.jtsGeometry])
  $.labels = Signal.of([])
}

export default graphics(specifics)
