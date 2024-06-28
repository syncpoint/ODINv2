import Signal from '@syncpoint/signal'
import * as Signals from './__Signals'
import { style } from './__style'
import { placement } from './linestring-placement'
import { labels } from './linestring-styles/labels'

const simplifyGeometry = (geometry, resolution) =>
  geometry.getCoordinates().length > 50
    ? geometry.simplify(resolution)
    : geometry

const $labels = feature => feature.$parameterizedSIDC.map(sidc => labels[sidc] || [])
const $placement = feature => feature.$definingGeometry.map(placement)

export const LineString = feature => {
  feature.$properties = Signals.$properties(feature)
  feature.$modifiers = Signals.$modifiers(feature)
  feature.$sidc = Signals.$sidc(feature)
  feature.$parameterizedSIDC = Signals.$parameterizedSIDC(feature)
  feature.$labels = $labels(feature)
  feature.$colorScheme = Signals.$colorScheme(feature)
  feature.$schemeStyle = Signals.$schemeStyle(feature)
  feature.$effectiveStyle = Signals.$effectiveStyle(feature)
  feature.$lineSmoothing = Signals.$lineSmoothing(feature)
  feature.$styleRegistry = Signals.$styleRegistry(feature)
  feature.$definingGeometry = Signals.$definingGeometry(feature)
  // feature.$placement = $placement(feature)
  feature.$simplifiedGeometry = Signal.link(simplifyGeometry, [feature.$definingGeometry, feature.$resolution])
  feature.$smoothenedGeometry = Signals.$smoothenedGeometry(feature)
  feature.$style = feature.$smoothenedGeometry.map(style)
}
