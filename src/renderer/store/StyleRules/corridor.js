/* eslint-disable camelcase */
import * as R from 'ramda'
import * as shared from './shared'
import styles from './corridor-styles'
import { transform } from '../../model/geometry'

const rules = [
  shared.sidc,
  shared.evalTextField,
  shared.effectiveStyle,
  shared.geometry,
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
  const placement = R.identity // labels are placed directly
  return { geometry, write, resolution, placement }
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
 * style :: [ol/style/Style]
 */
rules.push([next => {
  const { styleFactory, rewrite } = next
  const style = styles.ERROR(next)
    .map(rewrite)
    .flatMap(styleFactory)

  return { style }
}, ['err']])
