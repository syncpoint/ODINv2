import Signal from '@syncpoint/signal'
import transform from './_transform'
import { parameterized } from '../../symbology/2525c'
import polygonLabels from './polygon-styles/labels'
import placement from './polygon-styles/placement'
import evalSync from './_evalSync'
import smoothenedGeometry from './_smoothenedGeometry'
import defaultStyle from './defaultStyle'

const labels = sidc => (polygonLabels[sidc] || []).flat()
const lineSmoothing = style => style['line-smooth'] || false
const simplifiedGeometry = (geometry, resolution) => {
  const coordinates = geometry.getCoordinates()
  return coordinates[0].length > 50
    ? geometry.simplify(resolution)
    : geometry
}

export default $ => {
  $.resolution = Signal.of()
  const [read, write, pointResolution] = transform($.geometry)
  $.read = read
  $.write = write
  $.pointResolution = $.resolution.ap(pointResolution)
  $.utmGeometry = $.geometry.ap($.read)
  $.parameterizedSIDC = $.sidc.map(parameterized)
  $.labels = $.parameterizedSIDC.map(labels)
  $.evalSync = Signal.link(evalSync, [$.sidc, $.properties])
  $.simplifiedGeometry = Signal.link(simplifiedGeometry, [$.geometry, $.resolution])
  $.lineSmoothing = $.effectiveStyle.map(lineSmoothing)
  $.smoothenedGeometry = Signal.link(smoothenedGeometry, [$.simplifiedGeometry, $.lineSmoothing])
  $.utmSmoothenedGeometry = $.smoothenedGeometry.ap($.read)
  $.placement = $.utmSmoothenedGeometry.map(placement)

  return $.smoothenedGeometry.map(geometry => defaultStyle({ geometry }))
}
