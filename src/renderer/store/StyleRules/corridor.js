/* eslint-disable camelcase */
import * as shared from './shared'
import styles from './corridor-styles'
import { transform } from '../../model/geometry'

const rules = [
  shared.sidc,
  shared.evalTextField,
  shared.effectiveStyle,
  shared.styles,
  shared.style
]

export default rules


/**
 * geometry :: jsts/geom/geometry
 * write :: jsts/geom/geometry -> ol/geom/geometry
 * resolution :: Number
 */
rules.push([next => {
  const { definingGeometry, centerResolution } = next

  // Transform (TS/UTM).
  //
  const { read, write, pointResolution } = transform(definingGeometry)
  const geometry = read(definingGeometry)
  const resolution = pointResolution(centerResolution)
  const rewrite = ({ geometry, ...props }) => ({ geometry: write(geometry), ...props })
  return { geometry, rewrite, resolution }
}, ['mode', 'smoothen', 'geometryKey', 'centerResolution']])


/**
 * dynamicStyle
 * staticStyles
 */
rules.push([next => {
  const { parameterizedSIDC: sidc } = next
  const dynamicStyle = (styles[sidc] || styles.DEFAULT)
  const staticStyles = []
  return { dynamicStyle, staticStyles }
}, ['parameterizedSIDC']])


/**
 * placement
 */
rules.push([() => {
  return { placement: x => x }
}, ['geometry']])


/**
 * style :: [ol/style/Style]
 */
rules.push([next => {
  return { styles: styles.ERROR(next) }
}, ['err']])
