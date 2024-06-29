import Signal from '@syncpoint/signal'
import * as TS from '../ts'
import * as Math from '../../../shared/Math'
import { style } from './__style'
import { smooth } from './chaikin'
import { labels } from './polygon-styles/labels'
import styles from './polygon-styles'
import { placement } from './polygon-placement'

const mainStyles = $ => Signal.link((geometry, sidc, resolution) => {
  const context = { geometry, resolution, TS, ...Math }
  return (styles[sidc] || styles.DEFAULT)(context)
}, [$.geometry, $.parameterizedSIDC, $.resolution])

const simplifyGeometry = (geometry, resolution) =>
  geometry.getCoordinates()[0].length > 50
    ? geometry.simplify(resolution)
    : geometry

const smoothenGeometry = geometry => smooth(geometry)

export default {
  simplifyGeometry,
  smoothenGeometry,
  labels: parameterizedSIDC => labels[parameterizedSIDC] || [],
  labelPlacement: placement,
  mainStyles,
  style: $ => $.olSmoothenedGeometry.map(style)
}
