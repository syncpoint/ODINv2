import Signal from '@syncpoint/signal'
import * as TS from '../ts'
import * as Math from '../../../shared/Math'
import { smooth } from './chaikin'
import { labels } from './linestring-styles/labels'
import styles from './linestring-styles'
import { styleFactory } from './styleFactory'
import { placement } from './linestring-placement'

const simplifyGeometry = (geometry, resolution) =>
  geometry.getCoordinates().length > 50
    ? geometry.simplify(resolution)
    : geometry

const smoothenGeometry = geometry => smooth(geometry)

const mainStyles = $ => Signal.link((geometry, sidc, resolution) => {
  const context = { geometry, resolution, TS, ...Math }
  return (styles[sidc] || styles.DEFAULT)(context)
}, [$.geometry, $.parameterizedSIDC, $.resolution])

const style = $ => Signal.link((geometry, sidc, write, resolution, styleRegistry) => {
  const context = { geometry, resolution, TS, ...Math }
  return (styles[sidc] || styles.DEFAULT)(context)
    .map(({ geometry, ...rest }) => ({ geometry: write(geometry), ...rest }))
    .map(styleRegistry)
    .flatMap(styleFactory)
}, [$.geometry, $.parameterizedSIDC, $.write, $.resolution, $.styleRegistry])

export default {
  simplifyGeometry,
  smoothenGeometry,
  labels: parameterizedSIDC => labels[parameterizedSIDC] || [],
  labelPlacement: placement,
  mainStyles,
  style
}
