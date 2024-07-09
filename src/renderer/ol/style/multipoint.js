import Signal from '@syncpoint/signal'
import * as TS from '../ts'
import labels from './multipoint-styles/labels'
import styles from './multipoint-styles/index'
import placement from './polygon-styles/placement'

import _context from './_context'
import _labels from './_labels'
import _shape from './_shape'
import _selection from './_selection'

const _pointBuffer = geometry => {
  const [C, A] = TS.coordinates(geometry)
  const segment = TS.segment([C, A])
  return TS.pointBuffer(TS.point(C))(segment.getLength())
}

export default $ => {
  $.jtsGeometry = $.geometry.ap($.read)
  $.context = Signal.link(_context, [$.jtsGeometry, $.resolution])
  $.placement = $.jtsGeometry.map(_pointBuffer).map(placement)

  // ==> Mandatory slots to derive resulting style:

  $.shape = $.context.ap($.parameterizedSIDC.map(_shape(styles)))
  $.selection = Signal.link(_selection, [$.selectionMode, $.jtsGeometry])
  $.labels = $.parameterizedSIDC
    .map(_labels(labels))
    .ap($.placement)

  // <== Mandatory slots
}
