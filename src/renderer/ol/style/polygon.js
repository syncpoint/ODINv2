import Signal from '@syncpoint/signal'
import { parameterized } from '../../symbology/2525c'
import labels from './polygon-styles/labels'
import styles from './polygon-styles/index'
import placement from './polygon-styles/placement'

import _evalSync from './_evalSync'
import _smoothenedGeometry from './_smoothenedGeometry'
import _context from './_context'
import _labels from './_labels'
import _shape from './_shape'
import _lineSmoothing from './_lineSmoothing'
import _selection from './_selection'

const _simplifiedGeometry = (geometry, resolution) => {
  const coordinates = geometry.getCoordinates()
  return coordinates[0].length > 50
    ? geometry.simplify(resolution)
    : geometry
}

export default $ => {
  const { link } = Signal

  $.resolution = $.centerResolution.ap($.pointResolution)
  $.parameterizedSIDC = $.sidc.map(parameterized)
  $.evalSync = link(_evalSync, [$.sidc, $.properties])
  $.simplifiedGeometry = link(_simplifiedGeometry, [$.geometry, $.centerResolution])
  $.jtsSimplifiedGeometry = $.simplifiedGeometry.ap($.read)
  $.lineSmoothing = $.effectiveStyle.map(_lineSmoothing)
  $.smoothenedGeometry = link(_smoothenedGeometry, [$.simplifiedGeometry, $.lineSmoothing])
  $.jtsSmoothenedGeometry = $.smoothenedGeometry.ap($.read)
  $.context = link(_context, [$.jtsSmoothenedGeometry, $.resolution])
  $.placement = $.jtsSmoothenedGeometry.map(placement)

  // ==> Mandatory slots to fill to derive resulting style:

  $.shape = $.context.ap($.parameterizedSIDC.map(_shape(styles)))
  $.selection = Signal.link(_selection, [$.selectionMode, $.jtsSimplifiedGeometry])
  $.labels = $.parameterizedSIDC
    .map(_labels(labels))
    .ap($.evalSync)
    .ap($.placement)

  // <== Mandatory slots
}
