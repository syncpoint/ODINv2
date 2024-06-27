import Signal from '@syncpoint/signal'
import * as Signals from './__Signals'
import { style } from './__style'

const simplifyGeometry = (geometry, resolution) =>
  geometry.getCoordinates().length > 50
    ? geometry.simplify(resolution)
    : geometry

export const LineString = feature => {
  feature.$colorScheme = Signals.$colorScheme(feature)
  feature.$schemeStyle = Signals.$schemeStyle(feature)
  feature.$effectiveStyle = Signals.$effectiveStyle(feature)
  feature.$lineSmoothing = Signals.$lineSmoothing(feature)
  feature.$styleRegistry = Signals.$styleRegistry(feature)
  feature.$definingGeometry = Signals.$definingGeometry(feature)
  feature.$simplifiedGeometry = Signal.link(simplifyGeometry, [feature.$definingGeometry, feature.$resolution])
  feature.$smoothenedGeometry = Signals.$smoothenedGeometry(feature)
  feature.$style = feature.$smoothenedGeometry.map(style)
}
