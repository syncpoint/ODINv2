import * as shared from './shared'
import { transform } from '../../model/geometry'
import styles from './artillery-position'
import { styleFactory } from './styleFactory'

const collectStyles = [next => {
  const { parameterizedSIDC: sidc } = next
  const dynamicStyle = (styles[sidc] || styles.DEFAULT)
  return { dynamicStyle }
}, ['parameterizedSIDC']]

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
}, ['mode', 'geometryKey', 'centerResolution']]

export const style = [next => {
  const { dynamicStyle, selectedStyles, rewrite, effectiveStyle } = next
  const style = [...dynamicStyle(next), ...selectedStyles]
    .map(effectiveStyle)
    .map(rewrite)
    .flatMap(styleFactory)

  return { style }
}, ['dynamicStyle', 'selectedStyles', 'rewrite', 'effectiveStyle']]

// Rules must be executed from top to bottom (rank = 0 .. n - 1)
export default [
  shared.sidc,
  geometry,
  collectStyles,
  shared.effectiveStyle,
  shared.selectedStyles,
  style
]
