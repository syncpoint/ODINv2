/* eslint-disable camelcase */
import * as shared from './shared'
import styles from './corridor-styles'
import { transform } from '../../model/geometry'

const collectStyles = [next => {
  const { parameterizedSIDC: sidc } = next
  const dynamicStyle = (styles[sidc] || styles.DEFAULT)
  const staticStyles = []
  return { dynamicStyle, staticStyles }
}, ['parameterizedSIDC']]

/**
 * geometry :: jsts/geom/geometry
 * write :: jsts/geom/geometry -> ol/geom/geometry
 * resolution :: Number
 */
const geometry = [next => {
  const { definingGeometry, centerResolution } = next

  // Transform (TS/UTM).
  //
  const { read, write, pointResolution } = transform(definingGeometry)
  const geometry = read(definingGeometry)
  const simplifiedGeometry = geometry
  const resolution = pointResolution(centerResolution)
  const rewrite = ({ geometry, ...props }) => ({ geometry: write(geometry), ...props })
  return { geometry, simplifiedGeometry, rewrite, resolution }
}, ['mode', 'smoothen', 'geometryKey', 'centerResolution']]


const labelPlacement = [() => {
  return { placement: x => x }
}, ['geometry']]


const error = [next => {
  return { styles: styles.ERROR(next) }
}, ['err']]

export default [
  shared.sidc,
  shared.evalSync,
  collectStyles,
  shared.effectiveStyle,
  geometry,
  labelPlacement,
  shared.selectedStyles,
  shared.styles,
  error,
  shared.style
]
