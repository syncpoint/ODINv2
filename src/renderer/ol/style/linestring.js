import Signal from '@syncpoint/signal'
import labels from './linestring-styles/labels'
import styles from './linestring-styles/index'
import placement from './linestring-styles/placement'
import graphics from './graphics'
import keyequals from './keyequals'

import _smoothenedGeometry from './_smoothenedGeometry'
import _simplifiedGeometry from './_simplifiedGeometry'
import _context from './_context'
import _labels from './_labels'
import _shape from './_shape'
import _lineSmoothing from './_lineSmoothing'
import _selection from './_selection'

const specifics = $ => {
  $.simplifiedGeometry = Signal.link(_simplifiedGeometry, [$.geometry, $.centerResolution], { equals: keyequals() })
  $.jtsSimplifiedGeometry = $.simplifiedGeometry.ap($.read)
  $.lineSmoothing = $.effectiveStyle.map(_lineSmoothing)
  $.smoothenedGeometry = Signal.link(_smoothenedGeometry, [$.simplifiedGeometry, $.lineSmoothing])
  $.jtsSmoothenedGeometry = $.smoothenedGeometry.ap($.read)
  $.context = Signal.link(_context, [$.jtsSmoothenedGeometry, $.resolution])
  $.placement = $.jtsSmoothenedGeometry.map(placement)

  $.shape = $.context.ap($.parameterizedSIDC.map(_shape(styles)))
  $.selection = Signal.link(_selection, [$.selectionMode, $.jtsSimplifiedGeometry])
  $.labels = $.parameterizedSIDC
    .map(_labels(labels))
    .ap($.placement)

  return graphics($)
}

export default graphics(specifics)
